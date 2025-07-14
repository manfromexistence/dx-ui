import { registry } from "../registry";
import { promises as fs } from "fs";
import type { z } from "zod";
import type { registryItemFileSchema } from "@/registry/schema";
import path from "path";

const REGISTRY_BASE_PATH = process.cwd();
const PUBLIC_FOLDER_BASE_PATH = "public/r";

// Console colors and symbols
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    dim: "\x1b[2m"
} as const;

const symbols = {
    success: "✓",
    arrow: "→",
    error: "✗",
    dot: "•"
} as const;

function printDivider() {
    console.log(`${colors.dim}${"─".repeat(80)}${colors.reset}\n`);
}

// const REGISTRY_TYPE_FOLDERS: Record<string, string> = {
//     "registry:component": "components",
//     "registry:hook": "hooks",
//     "registry:lib": "lib",
//     "registry:block": "blocks",
// };

/**
 * bun run ./scripts/build-registry.ts
 *
 */
type File = z.infer<typeof registryItemFileSchema>;

async function writeFileRecursive(filePath: string, data: string) {
    const dir = path.dirname(filePath);

    try {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, data, "utf-8");
        console.log(`  ${colors.green}${symbols.success}${colors.reset} Output written to ${colors.cyan}${filePath}${colors.reset}`);
    } catch (error) {
        console.log();
        console.error(`  ${colors.red}${symbols.error} Error writing file ${filePath}${colors.reset}`);
        console.error(error);
        console.log();
    }
}

const getComponentFiles = async (files: File[], registryType: string) => {
    const filesArrayPromises = (files ?? []).map(async (file) => {
        try {
            if (typeof file === "string") {
                const normalizedPath = file.startsWith("/") ? file : `/${file}`;
                const filePath = path.join(REGISTRY_BASE_PATH, normalizedPath);
                const fileContent = await fs.readFile(filePath, "utf-8");
                
                const fileName = normalizedPath.split('/').pop() || '';
                console.log(`    ${colors.yellow}${symbols.dot}${colors.reset} Processing ${colors.cyan}${fileName}${colors.reset}`);
                
                return {
                    type: registryType,
                    content: fileContent,
                    path: normalizedPath,
                    target: `components/kokonutui/${fileName}`,
                };
            }
            const normalizedPath = file.path.startsWith("/")
                ? file.path
                : `/${file.path}`;
            const filePath = path.join(REGISTRY_BASE_PATH, normalizedPath);
            const fileContent = await fs.readFile(filePath, "utf-8");
            
            const fileName = normalizedPath.split('/').pop() || '';
            console.log(`    ${colors.yellow}${symbols.dot}${colors.reset} Processing ${colors.cyan}${fileName}${colors.reset}`);
            
            const getTargetPath = (type: string) => {
                switch (type) {
                    case "registry:hook":
                        return `/hooks/${fileName}`;
                    case "registry:lib":
                        return `/lib/${fileName}`;
                    case "registry:block":
                        return `/blocks/${fileName}`;
                    default:
                        return `components/kokonutui/${fileName}`;
                }
            };
            
            const fileType = typeof file === 'string' ? registryType : (file.type || registryType);
            
            return {
                type: fileType,
                content: fileContent,
                path: normalizedPath,
                target: typeof file === 'string' ? getTargetPath(registryType) : (file.target || getTargetPath(fileType)),
            };
        } catch (error) {
            console.error(`    ${colors.red}${symbols.error} Error processing file: ${typeof file === 'string' ? file : file.path}${colors.reset}`);
            throw error;
        }
    });

    const filesArray = await Promise.all(filesArrayPromises);
    return filesArray;
};

const main = async () => {
    console.log(`\n${colors.cyan}Registry Build Process${colors.reset}`);
    printDivider();
    
    const totalComponents = registry.length;
    
    for (let i = 0; i < registry.length; i++) {
        const component = registry[i];
        const files = component.files;
        if (!files) throw new Error("No files found for component");

        console.log(`${colors.yellow}${symbols.arrow} Component ${i + 1}/${totalComponents}: ${colors.reset}${component.name}`);
        
        const filesArray = await getComponentFiles(files, component.type);
        const jsonPath = `${PUBLIC_FOLDER_BASE_PATH}/${component.name}.json`;
        
        await writeFileRecursive(
            jsonPath,
            JSON.stringify({ ...component, files: filesArray }, null, 2)
        );
        
        if (i < registry.length - 1) {
            console.log(); // Add space between components
        }
    }
    
    printDivider();
};

main()
    .then(() => {
        console.log(`${colors.green}${symbols.success} Registry build completed successfully!${colors.reset}\n`);
    })
    .catch((err) => {
        console.log();
        console.error(`${colors.red}${symbols.error} Registry build failed:${colors.reset}`);
        console.error(err);
        console.log();
        process.exit(1);
    });
