import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as z from 'zod';
import { registryItemTypeSchema } from '@/registry/schema';

type ComponentType = z.infer<typeof registryItemTypeSchema>;

// Known npm package dependencies that might be used in components
const KNOWN_NPM_DEPENDENCIES = [
  '@ai-sdk/groq',
  '@hookform/resolvers',
  '@mdx-js/loader',
  '@mdx-js/react',
  '@radix-ui/react-accordion',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-label',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toast',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  '@radix-ui/react-tooltip',
  '@tailwindcss/typography',
  '@tsparticles/engine',
  '@tsparticles/react',
  '@tsparticles/slim',
  '@types/mdx',
  '@vercel/speed-insights',
  'ai',
  'class-variance-authority',
  'clsx',
  'cmdk',
  'cobe',
  'critters',
  'date-fns',
  'dotted-map',
  'embla-carousel-autoplay',
  'embla-carousel-react',
  'framer-motion',
  'fumadocs-core',
  'fumadocs-mdx',
  'fumadocs-twoslash',
  'fumadocs-typescript',
  'fumadocs-ui',
  'input-otp',
  'lenis',
  'lucide-react',
  'marked',
  'mini-svg-data-uri',
  'mongoose',
  'motion',
  'next',
  'next-themes',
  'react',
  'react-day-picker',
  'react-dom',
  'react-hook-form',
  'react-markdown',
  'react-resizable-panels',
  'recharts',
  'resend',
  'sonner',
  'swiper',
  'tailwind-merge',
  'tailwindcss-animate',
  'vaul',
  'verifymailjs',
  'zod',
  '@eslint/eslintrc',
  '@next/bundle-analyzer',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  'autoprefixer',
  'eslint',
  'eslint-config-next',
  'postcss',
  'prettier',
  'prettier-plugin-tailwindcss',
  'sharp',
  'tailwindcss',
  'typescript',
];

// Known registry dependencies mapping
const REGISTRY_DEPENDENCIES: Record<string, string> = {
  // UI components
  '@/components/ui/accordion': 'https://blocks.mvp-subha.me/r/accordion.json',
  '@/components/ui/alert-dialog':
    'https://blocks.mvp-subha.me/r/alert-dialog.json',
  '@/components/ui/alert': 'https://blocks.mvp-subha.me/r/alert.json',
  '@/components/ui/aspect-ratio':
    'https://blocks.mvp-subha.me/r/aspect-ratio.json',
  '@/components/ui/author-badge':
    'https://blocks.mvp-subha.me/r/author-badge.json',
  '@/components/ui/avatar': 'https://blocks.mvp-subha.me/r/avatar.json',
  '@/components/ui/badge': 'https://blocks.mvp-subha.me/r/badge.json',
  '@/components/ui/border-beam':
    'https://blocks.mvp-subha.me/r/border-beam.json',
  '@/components/ui/breadcrumb': 'https://blocks.mvp-subha.me/r/breadcrumb.json',
  '@/components/ui/button': 'https://blocks.mvp-subha.me/r/button.json',
  '@/components/ui/calendar': 'https://blocks.mvp-subha.me/r/calendar.json',
  '@/components/ui/card-carousel':
    'https://blocks.mvp-subha.me/r/card-carousel.json',
  '@/components/ui/card': 'https://blocks.mvp-subha.me/r/card.json',
  '@/components/ui/carousel': 'https://blocks.mvp-subha.me/r/carousel.json',
  '@/components/ui/chart': 'https://blocks.mvp-subha.me/r/chart.json',
  '@/components/ui/checkbox': 'https://blocks.mvp-subha.me/r/checkbox.json',
  '@/components/ui/collapsible':
    'https://blocks.mvp-subha.me/r/collapsible.json',
  '@/components/ui/command': 'https://blocks.mvp-subha.me/r/command.json',
  '@/components/ui/compare': 'https://blocks.mvp-subha.me/r/compare.json',
  '@/components/ui/container-scroll-animation':
    'https://blocks.mvp-subha.me/r/container-scroll-animation.json',
  '@/components/ui/context-menu':
    'https://blocks.mvp-subha.me/r/context-menu.json',
  '@/components/ui/counter': 'https://blocks.mvp-subha.me/r/counter.json',
  '@/components/ui/deferred-component':
    'https://blocks.mvp-subha.me/r/deferred-component.json',
  '@/components/ui/dialog': 'https://blocks.mvp-subha.me/r/dialog.json',
  '@/components/ui/drawer': 'https://blocks.mvp-subha.me/r/drawer.json',
  '@/components/ui/dropdown-menu':
    'https://blocks.mvp-subha.me/r/dropdown-menu.json',
  '@/components/ui/form': 'https://blocks.mvp-subha.me/r/form.json',
  '@/components/ui/globe': 'https://blocks.mvp-subha.me/r/globe.json',
  '@/components/ui/gridbeam': 'https://blocks.mvp-subha.me/r/gridbeam.json',
  '@/components/ui/home-badge': 'https://blocks.mvp-subha.me/r/home-badge.json',
  '@/components/ui/hover-card': 'https://blocks.mvp-subha.me/r/hover-card.json',
  '@/components/ui/input-otp': 'https://blocks.mvp-subha.me/r/input-otp.json',
  '@/components/ui/input': 'https://blocks.mvp-subha.me/r/input.json',
  '@/components/ui/label': 'https://blocks.mvp-subha.me/r/label.json',
  '@/components/ui/lazy-image': 'https://blocks.mvp-subha.me/r/lazy-image.json',
  '@/components/ui/marquee': 'https://blocks.mvp-subha.me/r/marquee.json',
  '@/components/ui/menubar': 'https://blocks.mvp-subha.me/r/menubar.json',
  '@/components/ui/minimal-card':
    'https://blocks.mvp-subha.me/r/minimal-card.json',
  '@/components/ui/mode-toggle':
    'https://blocks.mvp-subha.me/r/mode-toggle.json',
  '@/components/ui/mouse-trail':
    'https://blocks.mvp-subha.me/r/mouse-trail.json',
  '@/components/ui/navigation-menu':
    'https://blocks.mvp-subha.me/r/navigation-menu.json',
  '@/components/ui/pagination': 'https://blocks.mvp-subha.me/r/pagination.json',
  '@/components/ui/particles': 'https://blocks.mvp-subha.me/r/particles.json',
  '@/components/ui/pixelcards': 'https://blocks.mvp-subha.me/r/pixelcards.json',
  '@/components/ui/popover': 'https://blocks.mvp-subha.me/r/popover.json',
  '@/components/ui/progress': 'https://blocks.mvp-subha.me/r/progress.json',
  '@/components/ui/pulse-card': 'https://blocks.mvp-subha.me/r/pulse-card.json',
  '@/components/ui/radio-group':
    'https://blocks.mvp-subha.me/r/radio-group.json',
  '@/components/ui/resizable-navbar':
    'https://blocks.mvp-subha.me/r/resizable-navbar.json',
  '@/components/ui/resizable': 'https://blocks.mvp-subha.me/r/resizable.json',
  '@/components/ui/scramble': 'https://blocks.mvp-subha.me/r/scramble.json',
  '@/components/ui/scroll-area':
    'https://blocks.mvp-subha.me/r/scroll-area.json',
  '@/components/ui/select': 'https://blocks.mvp-subha.me/r/select.json',
  '@/components/ui/separator': 'https://blocks.mvp-subha.me/r/separator.json',
  '@/components/ui/sheet': 'https://blocks.mvp-subha.me/r/sheet.json',
  '@/components/ui/sidebar': 'https://blocks.mvp-subha.me/r/sidebar.json',
  '@/components/ui/skeleton': 'https://blocks.mvp-subha.me/r/skeleton.json',
  '@/components/ui/slider': 'https://blocks.mvp-subha.me/r/slider.json',
  '@/components/ui/sonner': 'https://blocks.mvp-subha.me/r/sonner.json',
  '@/components/ui/sparkles': 'https://blocks.mvp-subha.me/r/sparkles.json',
  '@/components/ui/spotlight-cards':
    'https://blocks.mvp-subha.me/r/spotlight-cards.json',
  '@/components/ui/spotlight': 'https://blocks.mvp-subha.me/r/spotlight.json',
  '@/components/ui/switch': 'https://blocks.mvp-subha.me/r/switch.json',
  '@/components/ui/table': 'https://blocks.mvp-subha.me/r/table.json',
  '@/components/ui/tabs': 'https://blocks.mvp-subha.me/r/tabs.json',
  '@/components/ui/textarea': 'https://blocks.mvp-subha.me/r/textarea.json',
  '@/components/ui/toast': 'https://blocks.mvp-subha.me/r/toast.json',
  '@/components/ui/toaster': 'https://blocks.mvp-subha.me/r/toaster.json',
  '@/components/ui/toggle-group':
    'https://blocks.mvp-subha.me/r/toggle-group.json',
  '@/components/ui/toggle': 'https://blocks.mvp-subha.me/r/toggle.json',
  '@/components/ui/tooltip': 'https://blocks.mvp-subha.me/r/tooltip.json',
  '@/components/ui/world-map': 'https://blocks.mvp-subha.me/r/world-map.json',
  '@/components/ui/wrap-button':
    'https://blocks.mvp-subha.me/r/wrap-button.json',

  // Hooks
  '@/hooks/use-auto-resize-textarea':
    'https://blocks.mvp-subha.me/r/use-auto-resize-textarea.json',
  '@/hooks/use-media-query':
    'https://blocks.mvp-subha.me/r/use-media-query.json',
  '@/hooks/use-mobile': 'https://blocks.mvp-subha.me/r/use-mobile.json',
  '@/hooks/use-toast': 'https://blocks.mvp-subha.me/r/use-toast.json',

  // Lib utilities
  '@/lib/code': 'https://blocks.mvp-subha.me/r/code.json',
  '@/lib/load-script': 'https://blocks.mvp-subha.me/r/load-script.json',
  '@/lib/metadata-image': 'https://blocks.mvp-subha.me/r/metadata-image.json',
  '@/lib/metadata': 'https://blocks.mvp-subha.me/r/metadata.json',
  '@/lib/source': 'https://blocks.mvp-subha.me/r/source.json',
  '@/lib/utils': 'https://blocks.mvp-subha.me/r/utils.json',
};

// Function to determine component type based on path
function determineComponentType(filePath: string): ComponentType {
  // Normalize the file path to use forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (
    normalizedPath.includes('/components/mvpblocks/') ||
    normalizedPath.includes('components/mvpblocks/')
  ) {
    return 'registry:block';
  } else if (
    normalizedPath.includes('/components/ui/') ||
    normalizedPath.includes('components/ui/')
  ) {
    return 'registry:ui';
  } else if (
    normalizedPath.includes('/hooks/') ||
    normalizedPath.includes('hooks/')
  ) {
    return 'registry:hook';
  } else if (
    normalizedPath.includes('/lib/') ||
    normalizedPath.includes('lib/')
  ) {
    return 'registry:lib';
  }

  // Default to block if can't determine
  return 'registry:block';
}

// Function to get registry file path based on component type
function getRegistryFilePath(componentType: ComponentType): string {
  switch (componentType) {
    case 'registry:block':
      return path.join(__dirname, '../registry/registry-blocks.ts');
    case 'registry:ui':
      return path.join(__dirname, '../registry/registry-ui.ts');
    case 'registry:hook':
      return path.join(__dirname, '../registry/registry-hooks.ts');
    case 'registry:lib':
      return path.join(__dirname, '../registry/registry-lib.ts');
    default:
      return path.join(__dirname, '../registry/registry-blocks.ts');
  }
}

// Function to generate component name from file path
function generateComponentName(filePath: string): string {
  // Extract the file name without extension
  const fileName = path.basename(filePath, path.extname(filePath));
  return fileName;
}

// Function to detect npm dependencies from file content
function detectNpmDependencies(fileContent: string): string[] {
  const dependencies: string[] = [];

  // Check for each known dependency in the file content
  for (const dependency of KNOWN_NPM_DEPENDENCIES) {
    // Check if the dependency is imported in the file
    if (
      fileContent.includes(`from "${dependency}"`) ||
      fileContent.includes(`from '${dependency}'`)
    ) {
      dependencies.push(dependency);
    }
  }

  return dependencies;
}

// Function to detect registry dependencies from file content
function detectRegistryDependencies(
  fileContent: string,
  filePath: string,
  visitedFiles: Set<string> = new Set(),
): string[] {
  // Add current file to visited files to prevent infinite recursion
  visitedFiles.add(filePath);

  const dependencies: string[] = [];

  // Check for utils import specifically since it's commonly used
  if (
    fileContent.includes('from "@/lib/utils"') ||
    fileContent.includes("from '@/lib/utils'")
  ) {
    const utilsUrl = 'https://blocks.mvp-subha.me/r/utils.json';
    if (!dependencies.includes(utilsUrl)) {
      dependencies.push(utilsUrl);
    }
  }

  // Detect imports from UI components using regex
  // This handles both destructured imports and default imports
  const uiImportRegex =
    /import\s+(?:(?:\{[^}]*\})|(?:[^\s{}]+))\s+from\s+["']@\/components\/ui\/([^"']+)["'];?/g;
  let uiMatch;
  while ((uiMatch = uiImportRegex.exec(fileContent)) !== null) {
    const componentName = uiMatch[1].replace(/\.tsx?$/, '');
    const url = `https://blocks.mvp-subha.me/r/${componentName}.json`;

    if (!dependencies.includes(url)) {
      dependencies.push(url);

      // Process nested dependencies from UI components
      try {
        const componentFilePath = `components/ui/${componentName}.tsx`;
        if (
          fs.existsSync(componentFilePath) &&
          !visitedFiles.has(componentFilePath)
        ) {
          const componentContent = fs.readFileSync(componentFilePath, 'utf-8');
          // Recursively detect dependencies in the imported component
          const nestedDependencies = detectRegistryDependencies(
            componentContent,
            componentFilePath,
            new Set([...visitedFiles]),
          );
          // Add unique dependencies
          for (const dep of nestedDependencies) {
            if (!dependencies.includes(dep)) {
              dependencies.push(dep);
            }
          }
        }
      } catch (error) {
        console.warn(
          `Warning: Could not process UI component ${componentName}`,
        );
      }
    }
  }

  // Check for known registry dependencies
  for (const [importPath, url] of Object.entries(REGISTRY_DEPENDENCIES)) {
    if (fileContent.includes(importPath) && !dependencies.includes(url)) {
      dependencies.push(url);

      // Also check for nested dependencies from imported components
      if (importPath.startsWith('@/') && !visitedFiles.has(importPath)) {
        try {
          // Convert import path to file path
          const componentFilePath = importPath.replace('@/', '');
          if (fs.existsSync(componentFilePath)) {
            const componentContent = fs.readFileSync(
              componentFilePath,
              'utf-8',
            );
            // Recursively detect dependencies in the imported component
            const nestedDependencies = detectRegistryDependencies(
              componentContent,
              componentFilePath,
              new Set([...visitedFiles]),
            );
            // Add unique dependencies
            for (const dep of nestedDependencies) {
              if (!dependencies.includes(dep)) {
                dependencies.push(dep);
              }
            }
          }
        } catch (error) {
          console.warn(
            `Warning: Could not process imported component ${importPath}`,
          );
        }
      }
    }
  }

  // Detect local component imports (relative imports)
  const importRegex =
    /import\s+(?:(?:\{[^}]*\})|(?:[^\s{}]+))\s+from\s+['"]\.\/(.*?)['"];?/g;
  let match;
  while ((match = importRegex.exec(fileContent)) !== null) {
    const importedFile = match[1];
    // Get the directory of the current file
    const dirPath = path.dirname(filePath);
    // Construct the path to the imported file
    let importedFilePath = path.join(dirPath, importedFile);

    // Add .tsx extension if not present
    if (
      !importedFilePath.endsWith('.tsx') &&
      !importedFilePath.endsWith('.ts')
    ) {
      importedFilePath += '.tsx';
    }

    // Check if the file exists
    if (fs.existsSync(importedFilePath)) {
      // Get the component name from the file path
      const componentName = path.basename(
        importedFilePath,
        path.extname(importedFilePath),
      );
      // Add as registry dependency
      dependencies.push(`https://blocks.mvp-subha.me/r/${componentName}.json`);

      // Recursively process the imported file to get its dependencies
      try {
        // Skip if we've already visited this file to prevent infinite recursion
        if (!visitedFiles.has(importedFilePath)) {
          const importedFileContent = fs.readFileSync(
            importedFilePath,
            'utf-8',
          );
          // Detect dependencies of the imported file
          const importedFileDependencies = detectRegistryDependencies(
            importedFileContent,
            importedFilePath,
            new Set([...visitedFiles]),
          );
          // Add unique dependencies
          for (const dep of importedFileDependencies) {
            if (!dependencies.includes(dep)) {
              dependencies.push(dep);
            }
          }

          // Also register the imported component if it's not already in the registry
          addComponentToRegistryIfNeeded(importedFilePath);
        }
      } catch (error) {
        console.warn(
          `Warning: Could not process imported file ${importedFilePath}`,
        );
      }
    }
  }

  return dependencies;
}

// Function to check if a component is already in the registry
function isComponentInRegistry(
  componentName: string,
  componentType: ComponentType,
): boolean {
  const registryFilePath = getRegistryFilePath(componentType);
  const registryContent = fs.readFileSync(registryFilePath, 'utf-8');
  return registryContent.includes(`name: "${componentName}"`);
}

// Function to add a component to the registry if it's not already there
function addComponentToRegistryIfNeeded(filePath: string): void {
  // Normalize the file path to use forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Determine component type
  const componentType = determineComponentType(normalizedPath);

  // Generate component name
  const componentName = generateComponentName(normalizedPath);

  // Check if component already exists in registry
  if (isComponentInRegistry(componentName, componentType)) {
    console.log(`Component "${componentName}" already exists in registry.`);
    return;
  }

  // Add the component to the registry
  addComponentToRegistry(filePath);
}

// Function to add component to registry
function addComponentToRegistry(filePath: string): void {
  // Normalize the file path to use forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Read the file content
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Detect dependencies
  const npmDependencies = detectNpmDependencies(fileContent);
  const registryDependencies = detectRegistryDependencies(
    fileContent,
    filePath,
    new Set(),
  );

  // Determine component type
  const componentType = determineComponentType(normalizedPath);

  // Get registry file path
  const registryFilePath = getRegistryFilePath(componentType);

  // Generate component name
  const componentName = generateComponentName(normalizedPath);

  // Read the registry file
  let registryContent = fs.readFileSync(registryFilePath, 'utf-8');

  // Check if component already exists in registry
  if (registryContent.includes(`name: "${componentName}"`)) {
    console.log(`Component "${componentName}" already exists in registry.`);
    return;
  }

  // Prepare the component path for registry
  let componentPath = normalizedPath;
  if (!componentPath.startsWith('@/')) {
    // If path doesn't start with @/, add it
    componentPath = `@/${componentPath}`;
  }

  // Prepare the import path for the component
  const importPath = componentPath.replace('@/', '../').replace(/\.tsx?$/, '');

  // Create the new component entry
  const registryArrayName =
    componentType === 'registry:block'
      ? 'blocks'
      : componentType === 'registry:ui'
        ? 'ui'
        : componentType === 'registry:hook'
          ? 'hooks'
          : 'lib';

  // Find the position to insert the new component
  // Make sure we're looking for the correct array name in the registry file
  const arrayStartRegex = new RegExp(
    `export const ${registryArrayName}[^\\[]*\\[`,
  );
  const match = registryContent.match(arrayStartRegex);

  if (!match) {
    console.error(
      `Could not find the ${registryArrayName} array in the registry file.`,
    );
    return;
  }

  const insertPosition = match.index! + match[0].length;

  // Create the component entry
  let componentEntry = `
  {
    name: "${componentName}",
    type: "${componentType}",
    dependencies: ${JSON.stringify(npmDependencies)},
    registryDependencies: ${JSON.stringify(registryDependencies)},
    files: [
      {
        path: "${componentPath}",
        type: "${componentType}",
      },
    ],`;

  // Add component lazy loading for blocks and UI components
  if (componentType === 'registry:block' || componentType === 'registry:ui') {
    componentEntry += `
    component: React.lazy(
      () => import("${importPath}"),
    ),`;
  }

  componentEntry += `
  },`;

  // Insert the component entry into the registry content
  const newRegistryContent =
    registryContent.slice(0, insertPosition) +
    componentEntry +
    registryContent.slice(insertPosition);

  // Write the updated registry content back to the file
  fs.writeFileSync(registryFilePath, newRegistryContent);

  console.log(
    `Added component "${componentName}" to ${registryArrayName} registry.`,
  );
  console.log(
    `- NPM Dependencies: ${npmDependencies.length > 0 ? npmDependencies.join(', ') : 'None'}`,
  );
  console.log(
    `- Registry Dependencies: ${registryDependencies.length > 0 ? registryDependencies.length + ' dependencies detected' : 'None'}`,
  );

  // Log each registry dependency for better visibility
  if (registryDependencies.length > 0) {
    console.log('  Registry Dependencies:');
    registryDependencies.forEach((dep) => {
      const depName = dep.split('/').pop()?.replace('.json', '') || '';
      console.log(`  - ${depName}`);
    });
  }
}

// Function to scan project directories and update dependencies
function updateDependenciesMappings() {
  console.log('Scanning project for components and dependencies...');

  // Paths to scan for components
  const componentPaths = [
    { dir: 'components/ui' },
    { dir: 'hooks' },
    { dir: 'lib' },
  ];

  // Scan each directory
  for (const { dir } of componentPaths) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    // Get all files in the directory (recursively)
    const files = getAllFiles(dir);

    // Process each file
    for (const file of files) {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const normalizedPath = file.replace(/\\/g, '/');
        const componentName = path.basename(
          normalizedPath,
          path.extname(normalizedPath),
        );

        // Add to REGISTRY_DEPENDENCIES if not already there
        const importPath = `@/${normalizedPath}`;
        const registryUrl = `https://blocks.mvp-subha.me/r/${componentName}.json`;

        if (!REGISTRY_DEPENDENCIES[importPath]) {
          REGISTRY_DEPENDENCIES[importPath] = registryUrl;
          console.log(
            `Added new component to registry dependencies: ${componentName}`,
          );
        }
      }
    }
  }

  // Scan package.json for npm dependencies
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Add all dependencies to KNOWN_NPM_DEPENDENCIES if not already there
    for (const dep of Object.keys(dependencies)) {
      if (!KNOWN_NPM_DEPENDENCIES.includes(dep)) {
        KNOWN_NPM_DEPENDENCIES.push(dep);
        console.log(`Added new npm dependency: ${dep}`);
      }
    }
  } catch (error) {
    console.warn('Could not read package.json to update npm dependencies');
  }
}

// Helper function to get all files in a directory recursively
function getAllFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Main function
function main() {
  // Get the file path from command line arguments
  const args = process.argv.slice(2);

  // Update dependencies mappings first
  updateDependenciesMappings();

  if (args.length === 0) {
    console.error('Please provide a file path.');
    process.exit(1);
  }

  const filePath = args[0];

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File "${filePath}" does not exist.`);
    process.exit(1);
  }

  // Add component to registry
  addComponentToRegistry(filePath);
  console.log('Running build:registry script...');
  execSync('bun run build:registry', { stdio: 'inherit' });

  console.log('All done! Component registered and built.');
}

main();
