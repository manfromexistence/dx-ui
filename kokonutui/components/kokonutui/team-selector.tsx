"use client";

/**
 * @author: @dorian_baffier
 * @description: Team Selector
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { AnimatePresence, motion, type Variants } from "motion/react";
import Image from "next/image";
import { useState } from "react";

const MAX_TEAM_SIZE = 4;

interface TeamMember {
    id: string;
    avatarUrl: string;
    name: string;
}

const TEAM_MEMBERS: TeamMember[] = [
    {
        id: "member-1",
        avatarUrl:
            "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png",
        name: "Team Member 1",
    },
    {
        id: "member-2",
        avatarUrl:
            "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-02-albo9B0tWOSLXCVZh9rX9KFxXIVWMr.png",
        name: "Team Member 2",
    },
    {
        id: "member-3",
        avatarUrl:
            "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-03-JateJIUhtd3PXynaMG9TDWQ55j5AVP.png",
        name: "Team Member 3",
    },
    {
        id: "member-4",
        avatarUrl:
            "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-04-uuYHWIRvVPi01gEt6NwnGyjqLeeZhz.png",
        name: "Team Member 4",
    },
] as const;

const animations = {
    container: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    } satisfies Variants,
    avatar: {
        initial: { opacity: 0, scale: 0.8 },
        animate: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3 },
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.15 },
        },
    } satisfies Variants,
    vibration: {
        initial: { x: 0 },
        animate: {
            x: [-5, 5, -5, 5, 0] as const,
            transition: { duration: 0.3 },
        },
    } satisfies Variants,
    number: {
        initial: { scale: 0.8, opacity: 0 },
        animate: {
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
            },
        },
    } satisfies Variants,
} as const;

interface TeamSelectorProps {
    defaultValue?: number;
    onChange?: (size: number) => void;
    className?: string;
}

export default function TeamSelector({
    defaultValue = 1,
    onChange,
    className = "",
}: TeamSelectorProps) {
    const [peopleCount, setPeopleCount] = useState(defaultValue);
    const [isVibrating, setIsVibrating] = useState(false);

    const handleIncrement = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (peopleCount < MAX_TEAM_SIZE) {
            const newCount = peopleCount + 1;
            setPeopleCount(newCount);
            onChange?.(newCount);
        } else {
            triggerVibration();
        }
    };

    const handleDecrement = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (peopleCount > 1) {
            const newCount = peopleCount - 1;
            setPeopleCount(newCount);
            onChange?.(newCount);
        } else {
            triggerVibration();
        }
    };

    const triggerVibration = () => {
        setIsVibrating(true);
        setTimeout(() => setIsVibrating(false), 300);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent,
        action: "increment" | "decrement"
    ) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            action === "increment" ? handleIncrement(e) : handleDecrement(e);
        }
    };

    const renderAvatars = () =>
        TEAM_MEMBERS.slice(0, peopleCount).map((member, index) => (
            <motion.div
                key={member.id}
                variants={animations.avatar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center justify-center"
                style={{
                    zIndex: peopleCount - index,
                    marginLeft: index === 0 ? 0 : -24,
                }}
            >
                <Image
                    src={member.avatarUrl}
                    width={96}
                    height={96}
                    alt={member.name}
                    className="rounded-full object-cover 
                             shadow-[0_8px_28px_-6px/0.2] dark:shadow-[0_8px_28px_-6px/0.3]
                             bg-gradient-to-b from-white/5 to-white/20 dark:from-white/5 dark:to-black/20
                             backdrop-blur-sm
                            hover:shadow-[0_12px_32px_-8px/0.3] dark:hover:shadow-[0_12px_32px_-8px/0.4]
                             transition-all duration-300 ease-fluid
                             border-[0.5px] border-white/10 dark:border-white/5"
                />
            </motion.div>
        ));

    return (
        <motion.div
            variants={animations.container}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`flex w-full flex-col items-center justify-center gap-8 ${className}`}
        >
            <fieldset className="w-full">
                <legend className="sr-only">Team size selector</legend>
                <div className="relative h-24 w-full flex justify-center">
                    <AnimatePresence mode="popLayout">
                        {renderAvatars()}
                    </AnimatePresence>
                </div>

                <motion.div
                    variants={isVibrating ? animations.vibration : undefined}
                    initial="initial"
                    animate={isVibrating ? "animate" : "initial"}
                    className="flex items-center justify-center gap-8 mt-8"
                >
                    <button
                        type="button"
                        onClick={handleDecrement}
                        onKeyDown={(e) => handleKeyDown(e, "decrement")}
                        disabled={peopleCount <= 1}
                        aria-label="Decrease team size"
                        className="h-12 w-12 rounded-full 
                                 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900
                                 border border-zinc-200/80 dark:border-zinc-700/80
                                 shadow-[0_2px_8px_-2px/0.1] dark:shadow-[0_2px_8px_-2px/0.3]
                                 hover:shadow-[0_4px_12px_-4px/0.2] dark:hover:shadow-[0_4px_12px_-4px/0.4]
                                 hover:border-zinc-300 dark:hover:border-zinc-600
                                 active:from-zinc-50 active:to-zinc-100 dark:active:from-zinc-900 dark:active:to-zinc-800
                                 text-zinc-900 dark:text-zinc-100 
                                 disabled:opacity-40 disabled:cursor-not-allowed 
                                 disabled:hover:shadow-[0_2px_8px_-2px/0.1] dark:disabled:hover:shadow-[0_2px_8px_-2px/0.3]
                                 disabled:hover:border-zinc-200/80 dark:disabled:hover:border-zinc-700/80
                                 disabled:active:from-white disabled:active:to-zinc-50 
                                 dark:disabled:active:from-zinc-800 dark:disabled:active:to-zinc-900
                                 transition-all duration-200 ease-fluid
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/30 dark:focus-visible:ring-zinc-400/30
                                 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                    >
                        <span className="text-2xl font-medium select-none">
                            -
                        </span>
                    </button>

                    <motion.output
                        key={peopleCount}
                        variants={animations.number}
                        initial="initial"
                        animate="animate"
                        className="text-2xl font-medium bg-clip-text text-transparent 
                                 bg-gradient-to-b from-zinc-800 to-zinc-600 dark:from-zinc-200 dark:to-zinc-400
                                 select-none"
                        aria-label={`Current team size: ${peopleCount}`}
                    >
                        {peopleCount}
                    </motion.output>

                    <button
                        type="button"
                        onClick={handleIncrement}
                        onKeyDown={(e) => handleKeyDown(e, "increment")}
                        disabled={peopleCount >= MAX_TEAM_SIZE}
                        aria-label="Increase team size"
                        className="h-12 w-12 rounded-full 
                                 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900
                                 border border-zinc-200/80 dark:border-zinc-700/80
                                 shadow-[0_2px_8px_-2px/0.1] dark:shadow-[0_2px_8px_-2px/0.3]
                                 hover:shadow-[0_4px_12px_-4px/0.2] dark:hover:shadow-[0_4px_12px_-4px/0.4]
                                 hover:border-zinc-300 dark:hover:border-zinc-600
                                 active:from-zinc-50 active:to-zinc-100 dark:active:from-zinc-900 dark:active:to-zinc-800
                                 text-zinc-900 dark:text-zinc-100 
                                 disabled:opacity-40 disabled:cursor-not-allowed 
                                 disabled:hover:shadow-[0_2px_8px_-2px/0.1] dark:disabled:hover:shadow-[0_2px_8px_-2px/0.3]
                                 disabled:hover:border-zinc-200/80 dark:disabled:hover:border-zinc-700/80
                                 disabled:active:from-white disabled:active:to-zinc-50 
                                 dark:disabled:active:from-zinc-800 dark:disabled:active:to-zinc-900
                                 transition-all duration-200 ease-fluid
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/30 dark:focus-visible:ring-zinc-400/30
                                 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                    >
                        <span className="text-2xl font-medium select-none">
                            +
                        </span>
                    </button>
                </motion.div>
            </fieldset>
        </motion.div>
    );
}
