"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";

interface PackageManagerTabsProps {
    onSelect: (packageManager: string) => void;
    commandName: string;
    prePath: string;
}

const packageManagers = [
    { id: "npm", title: "npm" },
    { id: "bun", title: "bun" },
    { id: "pnpm", title: "pnpm" },
];

export function PackageManagerTabs({
    onSelect,
    commandName,
    prePath,
}: PackageManagerTabsProps) {
    const [selected, setSelected] = React.useState<string>("bun");
    const [dimensions, setDimensions] = React.useState({ width: 0, left: 0 });
    const [isCopied, setIsCopied] = React.useState(false);

    // Reference for the selected button
    const buttonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
    const containerRef = React.useRef<HTMLDivElement>(null);
    const copyButtonRef = React.useRef<HTMLButtonElement>(null);

    // Update dimensions whenever selected tab changes or on mount
    React.useLayoutEffect(() => {
        const updateDimensions = () => {
            const selectedButton = buttonRefs.current.get(selected);
            const container = containerRef.current;

            if (selectedButton && container) {
                const rect = selectedButton.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                setDimensions({
                    width: rect.width,
                    left: rect.left - containerRect.left,
                });
            }
        };

        // Initial update
        requestAnimationFrame(() => {
            updateDimensions();
        });

        // Update on resize
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, [selected]);

    const handleTabClick = (tabId: string) => {
        setSelected(tabId);
        onSelect(tabId);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLButtonElement>,
        tabId: string
    ) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTabClick(tabId);
        }
    };

    const getCommand = (packageManager: string): string => {
        if (packageManager === "pnpm") {
            return `pnpm dlx shadcn@latest add ${prePath}/r/${commandName}.json`;
        } else if (packageManager === "npm") {
            return `npx shadcn@latest add ${prePath}/r/${commandName}.json`;
        } else {
            return `bunx shadcn@latest add ${prePath}/r/${commandName}.json`;
        }
    };

    const handleCopyCommand = () => {
        const commandToCopy = getCommand(selected);
        navigator.clipboard.writeText(commandToCopy);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2">
            <div
                ref={containerRef}
                role="tablist"
                aria-label="Package manager tabs"
                className={cn(
                    "relative flex items-center justify-start gap-1",
                    "bg-background rounded-sm",
                    "border",
                    "transition-all duration-200",
                    "h-7 text-black dark:text-white"
                )}
            >
                {/* Sliding Background */}
                <motion.div
                    className="absolute rounded-sm z-[1] bg-black dark:bg-white"
                    initial={false}
                    animate={{
                        width: dimensions.width - 4,
                        x: dimensions.left + 2,
                        opacity: 1,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                    }}
                    style={{ height: "calc(100% - 4px)", top: "2px" }}
                />

                <div className="flex relative z-[2]">
                    {packageManagers.map((item) => {
                        const isSelected = selected === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                ref={(el) => {
                                    if (el) buttonRefs.current.set(item.id, el);
                                    else buttonRefs.current.delete(item.id);
                                }}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                aria-controls={`panel-${item.id}`}
                                id={`tab-${item.id}`}
                                tabIndex={isSelected ? 0 : -1}
                                onClick={() => handleTabClick(item.id)}
                                onKeyDown={(e) => handleKeyDown(e, item.id)}
                                className={cn(
                                    "relative flex items-center justify-center gap-0.5 rounded-sm px-2 py-0.5 h-7",
                                    "text-xs font-medium transition-all duration-300",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    "truncate",
                                    isSelected
                                        ? "text-white dark:text-black"
                                        : " hover:bg-muted/50 hover:text-foreground text-black/50 dark:text-white/50"
                                )}
                            >
                                <span className="truncate">{item.title}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <button
                ref={copyButtonRef}
                type="button"
                onClick={handleCopyCommand}
                className={cn(
                    "h-7 text-xs font-medium",
                    "border border-black/10 dark:border-white/10",
                    "rounded-sm px-2",
                    "dark:text-white text-black",
                    "transition-all duration-200",
                    "group flex items-center justify-center gap-1",
                    "w-full",
                    "min-w-[250px]",
                    "relative"
                )}
            >
                <span
                    className={cn(
                        "absolute inset-0 flex items-center justify-center gap-1",
                        "transition-opacity duration-200",
                        isCopied ? "opacity-100" : "opacity-0"
                    )}
                >
                    <CheckCheck className="h-3.5 w-3.5 text-green-500 dark:text-green-500" />
                    <span className="truncate text-black/50 dark:text-white/50">
                        Copied to clipboard
                    </span>
                </span>
                <span
                    className={cn(
                        "truncate text-black/50 dark:text-white/50",
                        "transition-opacity duration-200",
                        isCopied ? "opacity-0" : "opacity-100"
                    )}
                >
                    {getCommand(selected)}
                </span>
            </button>
        </div>
    );
}
