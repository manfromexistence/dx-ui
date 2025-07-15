import * as React from "react";
import {
    useTheme,
    script,
    MEDIA,
    getTheme,
    disableAnimation,
    getSystemTheme,
    saveToLS,
    DXProps,
    Attribute,
} from "@/lib/theme";

const defaultThemes = ["light", "dark"];

export const DX = ({
    forcedTheme,
    disableTransitionOnChange = false,
    enableSystem = true,
    enableColorScheme = true,
    storageKey = "theme",
    themes = defaultThemes,
    defaultTheme = enableSystem ? "system" : "light",
    attribute = "data-theme",
    value,
    children,
    nonce,
    scriptProps,
}: DXProps) => {
    const { setTheme, setResolvedTheme, setSystemTheme } = useTheme();

    const applyTheme = React.useCallback(
        (theme: string) => {
            let resolved = theme;
            if (!resolved) return;

            if (theme === "system" && enableSystem) {
                resolved = getSystemTheme();
            }

            const name = value ? value[resolved] : resolved;
            const enable = disableTransitionOnChange ? disableAnimation(nonce) : null;
            const d = document.documentElement;

            const handleAttribute = (attr: Attribute) => {
                if (attr === "class") {
                    d.classList.remove(...(value ? Object.values(value) : themes));
                    if (name) d.classList.add(name);
                } else if (attr.startsWith("data-")) {
                    if (name) {
                        d.setAttribute(attr, name);
                    } else {
                        d.removeAttribute(attr);
                    }
                }
            };

            if (Array.isArray(attribute)) attribute.forEach(handleAttribute);
            else handleAttribute(attribute);

            if (enableColorScheme) {
                const fallback = ["light", "dark"].includes(defaultTheme)
                    ? defaultTheme
                    : null;
                const colorScheme = ["light", "dark"].includes(resolved)
                    ? resolved
                    : fallback;

                d.style.colorScheme = colorScheme as any;
            }

            enable?.();
        },
        [
            attribute,
            defaultTheme,
            disableTransitionOnChange,
            enableColorScheme,
            enableSystem,
            nonce,
            themes,
            value,
        ]
    );

    const handleMediaQuery = React.useCallback(
        (e: MediaQueryListEvent | MediaQueryList) => {
            const resolved = getSystemTheme(e);
            setResolvedTheme(resolved);
            setSystemTheme(resolved);

            const theme = getTheme(storageKey, defaultTheme);
            if (theme === "system" && enableSystem && !forcedTheme) {
                applyTheme("system");
            }
        },
        [
            applyTheme,
            defaultTheme,
            enableSystem,
            forcedTheme,
            setResolvedTheme,
            setSystemTheme,
            storageKey,
        ]
    );

    React.useEffect(() => {
        const media = window.matchMedia(MEDIA);
        media.addListener(handleMediaQuery);
        handleMediaQuery(media);

        return () => media.removeListener(handleMediaQuery);
    }, [handleMediaQuery]);

    React.useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key !== storageKey) {
                return;
            }

            if (!e.newValue) {
                setTheme(defaultTheme);
            } else {
                setTheme(e.newValue);
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [defaultTheme, setTheme, storageKey]);

    React.useEffect(() => {
        const theme = getTheme(storageKey, defaultTheme);
        applyTheme(forcedTheme ?? theme!);
    }, [applyTheme, forcedTheme, storageKey, defaultTheme]);

    return (
        <>
            <ThemeScript
                {...{
                    forcedTheme,
                    storageKey,
                    attribute,
                    enableSystem,
                    enableColorScheme,
                    defaultTheme,
                    value,
                    themes,
                    nonce,
                    scriptProps,
                }}
            />
            {children}
        </>
    );
};

export const ThemeScript = React.memo(
    ({
        forcedTheme,
        storageKey,
        attribute,
        enableSystem,
        enableColorScheme,
        defaultTheme,
        value,
        themes,
        nonce,
        scriptProps,
    }: Omit<DXProps, "children"> & { defaultTheme: string }) => {
        const scriptArgs = JSON.stringify([
            attribute,
            storageKey,
            defaultTheme,
            forcedTheme,
            themes,
            value,
            enableSystem,
            enableColorScheme,
        ]).slice(1, -1);

        return (
            <script
                {...scriptProps}
                suppressHydrationWarning
                nonce={typeof window === "undefined" ? nonce : ""}
                dangerouslySetInnerHTML={{
                    __html: `(${script.toString()})(${scriptArgs})`,
                }}
            />
        );
    }
);
