"use client";

import {
    useActionState,
    useEffect,
    useState,
    useTransition,
    useRef,
    type RefObject,
} from "react";
import { Code } from "lucide-react";
import { copyComponent } from "@/lib/action";
import { cn } from "@/lib/utils";
import { OpenInV0Button } from "../open-in-v0-button";
import { AnimatePresence, motion } from "motion/react";
import { PackageManagerTabs } from "./package-manager-tabs";
import { CheckCheck } from "lucide-react";

function SuccessParticles({
    buttonRef,
}: {
    buttonRef: React.RefObject<HTMLButtonElement>;
}) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Create a unique key for each particle to satisfy the linter
    const particles = Array.from({ length: 6 }, (_, index) => ({
        id: `particle-${index}-${Math.random().toString(36).substr(2, 9)}`,
        index, // Pass index for staggering delay
    }));

    return (
        <AnimatePresence>
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="fixed w-1 h-1 bg-black dark:bg-white rounded-full"
                    style={{ left: centerX, top: centerY }}
                    initial={{
                        scale: 0,
                        x: 0,
                        y: 0,
                    }}
                    animate={{
                        scale: [0, 1, 0],
                        x: [
                            0,
                            (particle.index % 2 ? 1 : -1) *
                                (Math.random() * 50 + 20),
                        ],
                        y: [0, -Math.random() * 50 - 20],
                    }}
                    transition={{
                        duration: 0.6,
                        delay: particle.index * 0.1, // Use particle.index for delay
                        ease: "easeOut",
                    }}
                />
            ))}
        </AnimatePresence>
    );
}

export default function PreviewContent({
    link,
    prePath,
    isBlock = false,
}: {
    link: string;
    prePath: string;
    isBlock?: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [state, formAction] = useActionState(copyComponent, {
        error: "",
        content: "",
        success: false,
    });
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isTerminalCopied, setIsTerminalCopied] = useState(false);

    const handleCopyClick = async () => {
        const [folder, filename] = link.split("/");

        startTransition(async () => {
            const formData = new FormData();
            formData.append("folder", folder);
            formData.append("fileName", filename);

            formAction(formData);
        });
    };

    const getFileName = () => {
        const [folder, filename] = link.split("/");
        return filename ? filename : folder;
    };

    const handleTerminalClick = (packageManager: string) => {
        const [folder, filename] = link.split("/");
        const componentName = filename ? filename : folder;

        let commandToCopy: string;
        const componentAddCommand = `shadcn@latest add ${prePath}/r/${componentName}`;

        if (packageManager === "pnpm") {
            commandToCopy = `pnpm dlx ${componentAddCommand}`;
        } else if (packageManager === "npm") {
            commandToCopy = `npx ${componentAddCommand}`;
        } else {
            commandToCopy = `bunx ${componentAddCommand}`;
        }

        navigator.clipboard.writeText(commandToCopy);
        setIsTerminalCopied(true);
        setTimeout(() => {
            setIsTerminalCopied(false);
        }, 1000);
    };

    const openInV0 = () => {
        const [folder, filename] = link.split("/");

        return filename ? filename : folder;
    };

    useEffect(() => {
        if (state.error) {
            setShowLoginDialog(true);
        }
        if (state.success && state.content) {
            setIsCopied(true);
            navigator.clipboard.writeText(state.content);

            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        }
    }, [state]);

    const terminalButtonRef = useRef<HTMLButtonElement>(null);
    const copyButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            {isTerminalCopied && (
                <SuccessParticles
                    buttonRef={
                        terminalButtonRef as RefObject<HTMLButtonElement>
                    }
                />
            )}
            {isCopied && (
                <SuccessParticles
                    buttonRef={copyButtonRef as RefObject<HTMLButtonElement>}
                />
            )}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-1 sm:gap-2">
                <div className="w-full sm:w-auto">
                    <PackageManagerTabs
                        onSelect={handleTerminalClick}
                        commandName={getFileName()}
                        prePath={prePath}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-1 sm:mt-0">
                    <OpenInV0Button name={openInV0()} />

                    {!isBlock && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCopyClick();
                            }}
                            className="w-full sm:w-auto"
                        >
                            <button
                                ref={copyButtonRef}
                                type="submit"
                                disabled={isPending}
                                className={cn(
                                    "relative overflow-hidden",
                                    "h-7 px-2 text-xs font-medium",
                                    "bg-black dark:bg-white",
                                    "text-white dark:text-black",
                                    "hover:bg-black/90 dark:hover:bg-white/90",
                                    "hover:text-white dark:hover:text-black",
                                    "transition-all duration-200",
                                    "group flex items-center justify-center gap-1",
                                    "rounded-sm",
                                    "shadow-none py-0 my-0",
                                    "w-fit md:w-full"
                                )}
                            >
                                {isCopied ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-white dark:text-black" />
                                ) : (
                                    <Code
                                        className={cn(
                                            "h-3.5 w-3.5",
                                            "transition-all duration-200",
                                            "group-hover:rotate-12"
                                        )}
                                    />
                                )}
                                <span>Copy</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
