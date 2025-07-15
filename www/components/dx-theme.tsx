import * as React from "react";

interface ValueObject {
  [themeName: string]: string;
}

type DataAttribute = `data-${string}`;

interface ScriptProps
  extends React.DetailedHTMLProps<
    React.ScriptHTMLAttributes<HTMLScriptElement>,
    HTMLScriptElement
  > {
  [dataAttribute: DataAttribute]: any;
}

export interface UseThemeProps {
  themes: string[];
  forcedTheme?: string | undefined;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  theme?: string | undefined;
  resolvedTheme?: string | undefined;
  systemTheme?: "dark" | "light" | undefined;
}

export type Attribute = DataAttribute | "class";

export interface DXProps extends React.PropsWithChildren<unknown> {
  themes?: string[] | undefined;
  forcedTheme?: string | undefined;
  enableSystem?: boolean | undefined;
  disableTransitionOnChange?: boolean | undefined;
  enableColorScheme?: boolean | undefined;
  storageKey?: string | undefined;
  defaultTheme?: string | undefined;
  attribute?: Attribute | Attribute[] | undefined;
  value?: ValueObject | undefined;
  nonce?: string;
  scriptProps?: ScriptProps;
}

const script = (
  attribute: Attribute | Attribute[],
  storageKey: string,
  defaultTheme: string,
  forcedTheme: string | undefined,
  themes: string[],
  value: ValueObject | undefined,
  enableSystem: boolean,
  enableColorScheme: boolean
) => {
  const el = document.documentElement;
  const systemThemes = ["light", "dark"];

  function updateDOM(theme: string) {
    const attributes = Array.isArray(attribute) ? attribute : [attribute];

    attributes.forEach((attr) => {
      const isClass = attr === "class";
      const classes =
        isClass && value ? themes.map((t) => value[t] || t) : themes;
      if (isClass) {
        el.classList.remove(...classes);
        el.classList.add(value && value[theme] ? value[theme] : theme);
      } else {
        el.setAttribute(attr, theme);
      }
    });

    setColorScheme(theme);
  }

  function setColorScheme(theme: string) {
    if (enableColorScheme && systemThemes.includes(theme)) {
      el.style.colorScheme = theme;
    }
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  if (forcedTheme) {
    updateDOM(forcedTheme);
  } else {
    try {
      const themeName = localStorage.getItem(storageKey) || defaultTheme;
      const isSystem = enableSystem && themeName === "system";
      const theme = isSystem ? getSystemTheme() : themeName;
      updateDOM(theme);
    } catch (e) {}
  }
};

const colorSchemes = ["light", "dark"];
const MEDIA = "(prefers-color-scheme: dark)";
const isServer = typeof window === "undefined";
const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined);
const defaultContext: UseThemeProps = { setTheme: (_) => {}, themes: [] };

const saveToLS = (storageKey: string, value: string) => {
  try {
    localStorage.setItem(storageKey, value);
  } catch (e) {}
};

export const useTheme = () => React.useContext(ThemeContext) ?? defaultContext;

export const DX = (props: DXProps) => {
  const context = React.useContext(ThemeContext);

  if (context) return <>{props.children}</>;
  return <Theme {...props} />;
};

const defaultThemes = ["light", "dark"];

const Theme = ({
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
  const [theme, setThemeState] = React.useState(() =>
    getTheme(storageKey, defaultTheme)
  );
  const [resolvedTheme, setResolvedTheme] = React.useState(() =>
    theme === "system" ? getSystemTheme() : theme
  );
  const attrs = !value ? themes : Object.values(value);

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
          d.classList.remove(...attrs);
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
        const fallback = colorSchemes.includes(defaultTheme)
          ? defaultTheme
          : null;
        const colorScheme = colorSchemes.includes(resolved)
          ? resolved
          : fallback;
        
        d.style.colorScheme = colorScheme as any;
      }

      enable?.();
    },
    [
      attribute,
      attrs,
      defaultTheme,
      disableTransitionOnChange,
      enableColorScheme,
      enableSystem,
      nonce,
      value,
    ]
  );

  const setTheme = React.useCallback(
    (value: React.SetStateAction<string>) => {
      if (typeof value === "function") {
        setThemeState((prevTheme) => {
          const newTheme = value(prevTheme as string);
          saveToLS(storageKey, newTheme);
          return newTheme;
        });
      } else {
        setThemeState(value);
        saveToLS(storageKey, value);
      }
    },
    [storageKey]
  );

  const handleMediaQuery = React.useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemTheme(e);
      setResolvedTheme(resolved);

      if (theme === "system" && enableSystem && !forcedTheme) {
        applyTheme("system");
      }
    },
    [applyTheme, enableSystem, forcedTheme, theme]
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
        setThemeState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [defaultTheme, setTheme, storageKey]);

  React.useEffect(() => {
    applyTheme(forcedTheme ?? theme!);
  }, [applyTheme, forcedTheme, theme]);

  const providerValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      forcedTheme,
      resolvedTheme: theme === "system" ? resolvedTheme : theme,
      themes: enableSystem ? [...themes, "system"] : themes,
      systemTheme: (
        enableSystem ? resolvedTheme : undefined
      ) as "light" | "dark" | undefined,
    }),
    [theme, setTheme, forcedTheme, resolvedTheme, enableSystem, themes]
  );

  return (
    <ThemeContext.Provider value={providerValue}>
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
    </ThemeContext.Provider>
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

const getTheme = (key: string, fallback?: string) => {
  if (isServer) return undefined;
  let theme;
  try {
    theme = localStorage.getItem(key) || undefined;
  } catch (e) {}
  return theme || fallback;
};

const disableAnimation = (nonce?: string) => {
  const css = document.createElement("style");
  if (nonce) css.setAttribute("nonce", nonce);
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
    )
  );
  document.head.appendChild(css);

  return () => {
    (() => window.getComputedStyle(document.body))();

    setTimeout(() => {
      document.head.removeChild(css);
    }, 1);
  };
};

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
  if (!e) e = window.matchMedia(MEDIA);
  const isDark = e.matches;
  const systemTheme = isDark ? "dark" : "light";
  return systemTheme;
};