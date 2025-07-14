"use client";

import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { CompassOutline } from "@/components/icons/compass";

export function BrowseComponentsButton() {
    return (
        <Link
            href="/docs/components/liquid-glass-card"
            className="flex items-center gap-8 relative"
        >
            {/* Background gradient elements */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-emerald-500/20 blur-3xl opacity-20 dark:opacity-30" />
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl opacity-20 dark:opacity-30 animate-pulse" />

            <motion.div
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1, transition: { duration: 0.2 } }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                className="relative"
            >
                <Button
                    className={cn(
                        "relative inline-flex items-center justify-center gap-4 rounded-xl font-medium isolate group overflow-hidden",
                        "relative h-10 px-6 min-w-72 md:min-w-56",
                        // Enhanced glass base
                        "bg-gradient-to-br from-black/70 via-black/80 to-black/70",
                        "dark:from-white/70 dark:via-white/80 dark:to-white/70",
                        "backdrop-blur-xl",
                        // Glass shine effect
                        "before:absolute before:inset-0 before:rounded-xl before:-z-10",
                        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                        "dark:before:from-transparent dark:before:via-black/10 dark:before:to-transparent",
                        // Enhanced borders
                        "border border-white/20 dark:border-black/20",
                        "ring-[0.5px] ring-white/10 ring-inset dark:ring-black/10",
                        // Text colors
                        "text-white dark:text-black",
                        // Shadows and glow
                        "shadow-[0_8px_32px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.15)]",
                        "[&>*]:relative [&>*]:z-10",
                        // Additional glass layers
                        "after:absolute after:inset-0 after:rounded-xl after:-z-20",
                        "after:bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]",
                        "after:dark:bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),rgba(0,0,0,0))]",
                        // Enhanced hover effects
                        "hover:bg-gradient-to-br hover:from-black/80 hover:via-black/90 hover:to-black/80",
                        "dark:hover:from-white/80 dark:hover:via-white/90 dark:hover:to-white/80",
                        "hover:before:opacity-100",
                        "hover:border-white/30 dark:hover:border-black/30",
                        "hover:ring-white/20 dark:hover:ring-black/20",
                        // Remove problematic shadows
                        // Shine animation on hover
                        "group-hover:before:animate-shine",
                        // Active state
                        "active:scale-[0.98]",
                        // Smooth transitions
                        "transition-all duration-300 ease-out",
                        "before:transition-all before:duration-500 before:ease-out",
                        "after:transition-all after:duration-300 after:ease-out"
                    )}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.15),rgba(255,255,255,0)_70%),radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.15),rgba(255,255,255,0)_70%),radial-gradient(circle_at_100%_50%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%),radial-gradient(circle_at_0%_50%,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.15),rgba(255,255,255,0)_70%),radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.15),rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(0,0,0,0.15),rgba(0,0,0,0)_70%),radial-gradient(circle_at_100%_0%,rgba(0,0,0,0.15),rgba(0,0,0,0)_70%),radial-gradient(circle_at_100%_50%,rgba(0,0,0,0.12),rgba(0,0,0,0)_70%),radial-gradient(circle_at_0%_50%,rgba(0,0,0,0.12),rgba(0,0,0,0)_70%),radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.15),rgba(0,0,0,0)_70%),radial-gradient(circle_at_0%_100%,rgba(0,0,0,0.15),rgba(0,0,0,0)_70%)]" />
                    <span className="font-medium relative z-10">
                        Browse Components
                    </span>
                    <CompassOutline className="w-8 h-8 transition-transform group-hover:rotate-12 relative z-10" />
                </Button>
            </motion.div>
        </Link>
    );
}
