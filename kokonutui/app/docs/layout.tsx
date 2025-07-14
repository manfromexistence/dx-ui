import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type { ReactNode } from "react";
import { baseOptions } from "../layout.config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: {
        template:
            "%s | KokonutUI - Free UI Components to build beautiful websites",
        default: "KokonutUI - Free UI Components to build beautiful websites",
    },
};

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={source.pageTree}
            {...baseOptions}
            sidebar={{
                defaultOpenLevel: 1,
                banner: (
                    <div className="border border-zinc-200 dark:border-zinc-800 text-white dark:text-zinc-900 p-2 rounded-md text-xs py-1 flex items-center gap-2 flex-col">
                        <Link
                            href="https://vercel.com/blog/spring25-oss-program#kokonutui"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-600 dark:text-gray-400  transition-colors flex items-center gap-1.5 text-xs hover:text-gray-800 dark:hover:text-gray-300 group hover:font-medium hover:cursor-pointer my-1"
                        >
                            <span className="hidden md:flex items-center gap-2">
                                <img
                                    alt="Vercel OSS Program"
                                    src="https://vercel.com/oss/program-badge.svg"
                                />
                            </span>
                        </Link>
                    </div>
                ),
            }}
        >
            {children}
        </DocsLayout>
    );
}
