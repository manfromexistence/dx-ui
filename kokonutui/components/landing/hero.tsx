"use client";

import {
    PlaneTakeoff,
    BarChart2,
    Video,
    AudioLines,
    Globe,
} from "lucide-react";
import { motion } from "motion/react";
import { BrowseBlocksButton } from "@/components/ui/browse-blocks";
import { BrowseComponentsButton } from "@/components/ui/browse-button";
import FeatureBlock from "./feature-block";
import ActionSearchBar from "@/components/kokonutui/action-search-bar";
import CardFlip from "@/components/kokonutui/card-flip";
import AI_Prompt from "@/components/kokonutui/ai-prompt";
import AppleActivityCard from "@/components/kokonutui/apple-activity-card";
import AILoadingState from "@/components/kokonutui/ai-loading";
import Link from "next/link";

interface Action {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
    short?: string;
    end?: string;
}

const allActions: Action[] = [
    {
        id: "1",
        label: "Book tickets",
        icon: <PlaneTakeoff className="h-4 w-4 text-blue-500" />,
        description: "Operator",
        short: "⌘K",
        end: "Agent",
    },
    {
        id: "2",
        label: "Summarize",
        icon: <BarChart2 className="h-4 w-4 text-orange-500" />,
        description: "gpt-4o",
        short: "⌘cmd+p",
        end: "Command",
    },
    {
        id: "3",
        label: "Screen Studio",
        icon: <Video className="h-4 w-4 text-purple-500" />,
        description: "gpt-4o",
        short: "",
        end: "Application",
    },
    {
        id: "4",
        label: "Talk to Jarvis",
        icon: <AudioLines className="h-4 w-4 text-green-500" />,
        description: "DeepSeek",
        short: "",
        end: "Active",
    },
    {
        id: "5",
        label: "Translate",
        icon: <Globe className="h-4 w-4 text-blue-500" />,
        description: "Gemini",
        short: "",
        end: "Command",
    },
];

export function HeroSection() {
    return (
        <div className="container mx-auto max-w-7xl min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 px-4 py-8 md:py-12 relative">
            {/* Left side - Title and CTA */}
            <div className="w-full lg:w-[45%] flex flex-col items-start text-left space-y-8 md:mb-28">
                <div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-100">
                        Collection of stunning components.
                    </h1>
                    <p className="mt-6 text-base md:text-xl text-zinc-900/90 dark:text-zinc-300/90 tracking-tighter max-w-lg">
                        Beautiful, modern UI components built with{" "}
                        <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-500 via-rose-500 to-purple-500 dark:from-orange-400 dark:via-rose-400 dark:to-purple-400">
                            Tailwind CSS
                        </span>
                        {", "}
                        <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-500 via-rose-500 to-purple-500 dark:from-orange-400 dark:via-rose-400 dark:to-purple-400">
                            shadcn/ui
                        </span>
                        {" & "}
                        <span className="bg-clip-text text-transparent bg-linear-to-r from-orange-500 via-rose-500 to-purple-500 dark:from-orange-400 dark:via-rose-400 dark:to-purple-400">
                            Motion
                        </span>
                        . <br />
                        100+ open-source components designed for{" "}
                        <span className="font-semibold">React</span>
                        {" & "}
                        <span className="font-semibold">Next.js</span>.
                    </p>
                </div>
                <div className="flex flex-col justify-center sm:justify-start w-full">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-2">
                        <BrowseComponentsButton />
                        <BrowseBlocksButton />
                    </div>
                </div>
                <FeatureBlock />
                <div className="w-full space-y-2 mt-8">
                    <div className="w-full h-[1px] bg-gradient-to-r from-zinc-950/5 via-zinc-950/50 dark:from-zinc-50/5 dark:via-zinc-50/50 to-transparent" />
                    <div className="w-[70%] h-[1px] bg-gradient-to-r from-zinc-950/5 via-zinc-950/30 dark:from-zinc-50/5 dark:via-zinc-50/30 to-transparent" />
                </div>
                <Link
                    href="https://vercel.com/blog/spring25-oss-program#kokonutui"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-1.5 text-xs hover:text-gray-800 dark:hover:text-gray-300 group hover:font-medium hover:cursor-pointer my-1 mt-2 mb-4"
                >
                    <span className="flex items-center gap-2">
                        <img
                            alt="Vercel OSS Program"
                            src="https://vercel.com/oss/program-badge.svg"
                        />
                    </span>
                </Link>
            </div>

            <div className="w-full lg:w-[55%] flex flex-col justify-between gap-8 lg:pl-8">
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center relative"
                >
                    <motion.div
                        className="w-full flex flex-col items-center justify-center"
                        initial={{ rotate: -5 }}
                        whileHover={{ rotate: 0, scale: 1.02 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                    >
                        <CardFlip />
                    </motion.div>

                    <motion.div
                        className="w-full"
                        initial={{ rotate: 3, y: 20 }}
                        whileHover={{ rotate: 0, y: 0, scale: 1.02 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                    >
                        <ActionSearchBar
                            actions={allActions}
                            defaultOpen={true}
                        />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 1, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ rotate: 0, scale: 1.02 }}
                    transition={{
                        duration: 0.5,
                        delay: 0.2,
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                    }}
                    className="w-full flex flex-col items-center justify-center -mt-4 md:mt-0"
                >
                    <AI_Prompt />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative -mt-4 md:mt-0"
                >
                    {/* Left side - Buttons */}
                    <motion.div
                        className="w-full"
                        initial={{ rotate: -4, x: -10 }}
                        whileHover={{ rotate: 0, x: 0, scale: 1.02 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                    >
                        <div className="w-full flex flex-col items-center justify-center gap-3">
                            <AILoadingState />
                        </div>
                    </motion.div>

                    {/* Right side - Input */}
                    <motion.div
                        className="w-full"
                        initial={{ rotate: 4, x: 10 }}
                        whileHover={{ rotate: 0, x: 0, scale: 1.02 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                    >
                        <AppleActivityCard title="" />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
