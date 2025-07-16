import fs from 'node:fs';
import path from 'node:path';
import { transformAsync } from '@babel/core';
import babelPluginReactDisplayName from 'babel-plugin-add-react-displayname/index.js';
import * as cheerio from 'cheerio';
import type { Options } from 'react-scan';
import type { Plugin, ResolvedConfig } from 'vite';

async function resolveModuleFileContent(moduleName: string, startDir: string = process.cwd()) {
  const modulePath = path.join('node_modules', moduleName);
  const resolvedPath = path.resolve(startDir, modulePath);

  try {
    return await fs.promises.readFile(resolvedPath, 'utf-8');
  } catch {
    const parentDir = path.dirname(startDir);
    if (parentDir !== startDir) {
      return resolveModuleFileContent(moduleName, parentDir);
    }
    throw new Error(`Module ${moduleName} not found`);
  }
}

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const createLogger = (prefix: string, debug = false): Logger => {
  return {
    debug: (...args: unknown[]) =>
      debug && process.stdout.write(`[${prefix}] ${args.join(' ')}\n`),
    info: (...args: unknown[]) =>
      process.stdout.write(`[${prefix}] ${args.join(' ')}\n`),
    warn: (...args: unknown[]) =>
      process.stderr.write(`[${prefix}] WARN: ${args.join(' ')}\n`),
    error: (...args: unknown[]) =>
      process.stderr.write(`[${prefix}] ERROR: ${args.join(' ')}\n`),
  };
};

interface ReactScanPluginOptions {
  /**
   * Enable/disable scanning
   * @default process.env.NODE_ENV === 'development'
   */
  enable?: boolean;

  /**
   * Custom React Scan options
   */
  scanOptions?: Options;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Automatically add display names to React components
   * @default true
   */
  autoDisplayNames?: boolean;
}

const PLUGIN_NAME = 'vite-plugin-react-scan';

const DEFAULT_SCAN_OPTIONS: Partial<Options> = {};

const validateOptions = (options: ReactScanPluginOptions) => {
  if (options.scanOptions && typeof options.scanOptions !== 'object') {
    throw new Error('scanOptions must be an object');
  }

  if (options.enable !== undefined && typeof options.enable !== 'boolean') {
    throw new Error('enable must be a boolean');
  }

  if (options.debug !== undefined && typeof options.debug !== 'boolean') {
    throw new Error('debug must be a boolean');
  }

  if (
    options.autoDisplayNames !== undefined &&
    typeof options.autoDisplayNames !== 'boolean'
  ) {
    throw new Error('autoDisplayNames must be a boolean');
  }
};

const JSX_EXTENSIONS = ['.jsx', '.tsx'] as const;
const REACT_SCAN_IDENTIFIER = 'react-scan';

const isJsxFile = (id: string) =>
  JSX_EXTENSIONS.some((ext) => id.endsWith(ext));

const reactScanPlugin = (options: ReactScanPluginOptions = {}): Plugin => {
  validateOptions(options);
  const {
    enable = process.env.NODE_ENV === 'development',
    scanOptions = DEFAULT_SCAN_OPTIONS,
    debug = false,
    autoDisplayNames = false,
  } = options;

  let config: ResolvedConfig;
  let isBuild = false;
  let scanFilePath = '';
  let assetsDir = '';

  const log = createLogger(PLUGIN_NAME, debug);

  const generateScanScript = (options: Options = {}) => {
    const hasOptions = Object.keys(options).length > 0;

    if (isBuild) {
      // Create a proper JSON string for the options and wrap it in single quotes
      const optionsJson = hasOptions ? `${JSON.stringify(options)}` : '{}';

      return `
        <script>
          const runScan = (options) => {
            if (reactScan){
              reactScan(${optionsJson});
            }
          };
        </script>
        <script src="${scanFilePath}" onload="runScan()"></script>
      `;
    }

    // Development version - use the base path from config
    const base = config.base || '/';
    return `
    <script type="module">
      import { scan } from '${base}@id/react-scan';
      (async () => {
        try {
          scan(${hasOptions ? JSON.stringify(options) : ''});
        } catch (error) {
          console.error('[${PLUGIN_NAME}] Scan failed:', error);
        }
      })();
    </script>`;
  };

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',

    config(config) {
      return {
        optimizeDeps: {
          exclude: [...(config.optimizeDeps?.exclude || []), 'react-scan'],
        },
      };
    },

    transform: async (code, id) => {
      if (!autoDisplayNames || !isJsxFile(id)) {
        return null;
      }

      try {
        const result = await transformAsync(code, {
          presets: [
            [
              '@babel/preset-typescript',
              {
                isTSX: isJsxFile(id),
                allExtensions: true,
              },
            ],
          ],
          plugins: [
            [
              '@babel/plugin-transform-react-jsx',
              {
                runtime: 'automatic',
              },
            ],
            babelPluginReactDisplayName,
          ],
          filename: id,
          configFile: false,
          babelrc: false,
        });

        if (!result?.code) {
          log.warn(`No code generated for ${id}`);
          return null;
        }

        log.debug(`Successfully transformed ${id}`);
        return { code: result.code };
      } catch (error) {
        log.error(`Failed to transform ${id}:`, error);
        return null;
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      isBuild = config.command === 'build';
      assetsDir = config.build?.assetsDir || 'assets';
      const base = config.base || '/';

      // Ensure base path is properly formatted
      scanFilePath = path.posix.join(base, assetsDir, 'auto.global.js');

      log.debug('Plugin initialized with config:', {
        mode: config.mode,
        base,
        enable,
        isBuild,
        assetsDir,
        scanOptions,
        scanFilePath,
      });
    },

    transformIndexHtml(html) {
      if (!enable) {
        log.debug('Plugin disabled');
        return html;
      }

      try {
        const $ = cheerio.load(html);
        const scanScript = generateScanScript(scanOptions);

        // Remove any existing React Scan script to avoid duplicates
        let removedCount = 0;
        $('script').each((_index: number, element: cheerio.Element) => {
          const content = $(element).html() || '';
          if (content.includes(REACT_SCAN_IDENTIFIER)) {
            $(element).remove();
            removedCount++;
          }
        });

        if (removedCount > 0) {
          log.debug(`Removed ${removedCount} existing scan script(s)`);
        }

        if (isBuild) {
          // In build, insert at the beginning of head
          $('head').prepend(scanScript);
          log.debug(
            'Injected scan script at the beginning of head (build)',
          );
        } else {
          // In development, insert after Vite's client script
          const viteClientScript = $('script[src="/@vite/client"]');
          if (viteClientScript.length) {
            viteClientScript.after(scanScript);
            log.debug('Injected scan script after Vite client (serve)');
          } else {
            $('head').append(scanScript);
            log.debug('Injected scan script at end of head (serve)');
          }
        }

        return $.html();
      } catch (error) {
        log.error('Failed to transform HTML:', error);
        return html;
      }
    },

    resolveId(id) {
      if (!isBuild && id === `/@id/${REACT_SCAN_IDENTIFIER}`) {
        log.debug('Resolving react-scan module');
        return REACT_SCAN_IDENTIFIER;
      }
      return null;
    },

    async generateBundle() {
      if (isBuild && enable) {
        log.debug('Build started, processing react-scan');

        try {
          const moduleNamePath = `${REACT_SCAN_IDENTIFIER}/dist/auto.global.js`;
          const content = await resolveModuleFileContent(moduleNamePath);

          // Let Vite handle the file placement in configured assets directory
          const assetFileName = `${assetsDir}/auto.global.js`;

          // Emit the file to the build output
          this.emitFile({
            type: 'asset',
            fileName: assetFileName,
            source: content,
          });

          // Store the full path for use in the script tag
          scanFilePath = `/${assetFileName}`;
          log.debug('Emitted react-scan as asset:', assetFileName);
        } catch (error) {
          log.error('Failed to process react-scan:', error);
          throw new Error(
            `Unable to locate '${REACT_SCAN_IDENTIFIER}'. This module is a required peer dependency.
Please ensure 'react-scan' is installed in your project using your preferred package manager.`,
          );
        }
      }
    },

    buildEnd() {
      if (isBuild) {
        log.debug('Build completed');
      }
    },
  };
};

export default reactScanPlugin;
