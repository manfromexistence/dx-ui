import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { cn } from "@/lib/utils";
import { META_THEME_COLORS, siteConfig } from "@/config/site";
import { RootProvider } from "fumadocs-ui/provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ViewTransitions } from "next-view-transitions";
import { Geist } from "next/font/google";

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist",
});

export const metadata: Metadata = {
    title: `${siteConfig.name} - ${siteConfig.description}`,
    description: siteConfig.description,
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    keywords: [
        "ui",
        "components",
        "Tailwind CSS",
        "Next.js",
        "shadcn",
        "motion",
        "react design",
    ],
    robots: "index, follow",
    authors: [{ name: "Dorian Baffier", url: "https://x.com/dorian_baffier" }],
    creator: "Dorian Baffier",
    openGraph: {
        title: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        siteName: siteConfig.name,
    },
    twitter: {
        card: "summary_large_image",
        creator: "@dorian_baffier",
        title: siteConfig.name,
        description: siteConfig.description,
    },
};

export const viewport: Viewport = {
    themeColor: [
        {
            media: "(prefers-color-scheme: light)",
            color: META_THEME_COLORS.light,
        },
        {
            media: "(prefers-color-scheme: dark)",
            color: META_THEME_COLORS.dark,
        },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ViewTransitions>
            <html lang="en" suppressHydrationWarning>
                <body
                    className={cn(
                        geist.variable,
                        geist.className,
                        "antialiased"
                    )}
                >
                    <RootProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <div className="flex flex-col min-h-screen">
                                <div className="flex-1">{children}</div>
                            </div>
                        </ThemeProvider>
                    </RootProvider>
                    <Analytics />
                    <SpeedInsights />
                </body>
            </html>
        </ViewTransitions>
    );
}
