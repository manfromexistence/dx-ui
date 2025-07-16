"use client";

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
import {
    useMotionValue,
    useReducedMotion,
    useInView,
    usePanGesture,
    useLayoutAnimation,
    animate,
    motion,
    MotionComponentProps,
    AnimationValues,
    Transition,
    LayoutGroupContext,
    ReorderContext
} from "@/lib/motion";

const defaultThemes = ["light", "dark"];

export const DX = ({
    forcedTheme,
    disableTransitionOnChange = true,
    enableSystem = true,
    enableColorScheme = true,
    storageKey = "theme",
    themes = defaultThemes,
    defaultTheme = "system",
    attribute = "class",
    value,
    children,
    nonce,
    scriptProps,
}: DXProps) => {
    const { theme, setTheme, setResolvedTheme, setSystemTheme } = useTheme();

    const applyTheme = React.useCallback(
        (themeToApply: string) => {
            let resolved = themeToApply;
            if (!resolved) return;

            if (themeToApply === "system" && enableSystem) {
                resolved = getSystemTheme();
            }

            setResolvedTheme(resolved);

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

            if (Array.isArray(attribute)) {
                attribute.forEach(handleAttribute);
            } else {
                handleAttribute(attribute);
            }

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
            setResolvedTheme,
            themes,
            value,
        ]
    );

    const handleMediaQuery = React.useCallback(
        (e: MediaQueryListEvent | MediaQueryList) => {
            const newSystemTheme = getSystemTheme(e);
            setSystemTheme(newSystemTheme);
            if (theme === "system" && !forcedTheme) {
                applyTheme("system");
            }
        },
        [applyTheme, forcedTheme, setSystemTheme, theme]
    );

    React.useEffect(() => {
        const storedTheme = getTheme(storageKey, defaultTheme) ?? defaultTheme;
        setTheme(storedTheme);
        handleMediaQuery(window.matchMedia(MEDIA));
    }, []);

    React.useEffect(() => {
        if (theme) {
            applyTheme(forcedTheme ?? theme);
            if (!forcedTheme) {
                saveToLS(storageKey, theme);
            }
        }
    }, [theme, forcedTheme, applyTheme, storageKey]);

    React.useEffect(() => {
        const media = window.matchMedia(MEDIA);
        media.addListener(handleMediaQuery);

        const handleStorage = (e: StorageEvent) => {
            if (e.key !== storageKey) return;
            const newTheme = e.newValue || defaultTheme;
            setTheme(newTheme);
        };
        window.addEventListener("storage", handleStorage);

        return () => {
            media.removeListener(handleMediaQuery);
            window.removeEventListener("storage", handleStorage);
        };
    }, [defaultTheme, handleMediaQuery, setTheme, storageKey]);

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

// --- dx-motion Components ---

export const MotionContext = createContext<Partial<MotionComponentProps>>({});
export const MotionConfig = ({ children, ...props }: React.PropsWithChildren<Partial<MotionComponentProps>>) => (
    <MotionContext.Provider value={props}>{children}</MotionContext.Provider>
);

const PresenceContext = createContext<{ isPresent: boolean; onExitComplete?: (id: string | number) => void; } | null>(null);

export function AnimatePresence({ children }: { children: React.ReactNode }) {
    const [presentChildren, setPresentChildren] = useState<React.ReactElement[]>([]);
    const exiting = useRef(new Set<string | number>()).current;

    useLayoutEffect(() => {
        const newChildren = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[];
        const newKeys = new Set(newChildren.map(c => c.key!));
        const prevKeys = new Set(presentChildren.map(c => c.key!));

        const entering = newChildren.filter(c => !prevKeys.has(c.key!));
        const exitingChildren = presentChildren.filter(c => !newKeys.has(c.key!));

        exitingChildren.forEach(child => exiting.add(child.key!));

        const onExitComplete = (key: string | number) => {
            exiting.delete(key);
            setPresentChildren(prev => prev.filter(c => c.key !== key));
        };

        setPresentChildren(prev => {
            const current = prev.filter(c => !exiting.has(c.key!));
            return [...current, ...entering];
        });

    }, [children, exiting]);

    return (
        <PresenceContext.Provider value={{ isPresent: true }}>
            {presentChildren.map(child => {
                const isExiting = exiting.has(child.key!);
                return (
                    <PresenceContext.Provider key={child.key} value={{ isPresent: !isExiting, onExitComplete: () => onExitComplete(child.key!) }}>
                        {React.cloneElement(child, { _isExiting: isExiting })}
                    </PresenceContext.Provider>
                );
            })}
        </PresenceContext.Provider>
    );
}

const svgTags = new Set([
    "svg", "path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "g", "text", "tspan", "textPath", "defs", "marker", "symbol", "clipPath", "mask", "foreignObject"
]);

const motionComponent = <P extends object, R>(Component: React.ForwardRefExoticComponent<P & React.RefAttributes<R>>, isSVG = false) => {
    return React.forwardRef<R, P & MotionComponentProps & { _isExiting?: boolean }>((props, externalRef) => {
        const config = useContext(MotionContext);
        const presence = useContext(PresenceContext);
        const { animate: animateProps, initial, exit, transition, whileHover, whileTap, whileFocus, whileInView, viewport, drag, dragConstraints, onDragStart, onDrag, onDragEnd, layout, layoutId, style, _isExiting, ...rest } = { ...config, ...props };

        const internalRef = useRef<HTMLElement>(null);
        const ref = (externalRef || internalRef) as React.RefObject<HTMLElement>;

        const reducedMotion = useReducedMotion();
        const isMounted = useRef(false);
        const isInView = useInView(ref, viewport);

        const motionValues = useMemo(() => {
            const values: { [key: string]: MotionValue<any> } = {};
            const allKeys = { ...style, ...initial, ...animateProps, ...whileHover, ...whileTap, ...exit, ...whileInView, ...whileFocus };
            for (const key in allKeys) {
                if (key.startsWith('--') || typeof allKeys[key] === 'number' || (typeof allKeys[key] === 'string' && (allKeys[key].match(numberRegex) || allKeys[key].match(colorRegex)))) {
                    const initialValue = (style as any)?.[key] ?? initial?.[key] ?? (key === "scale" ? 1 : 0);
                    values[key] = useMotionValue(initialValue);
                }
            }
            return values;
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const runAnimation = useCallback((values: AnimationValues | undefined, onComplete?: () => void) => {
            if (!values || reducedMotion) {
                onComplete?.();
                return;
            }
            const animations = Object.keys(values).map((key, i) => new Promise(resolve => {
                const mv = motionValues[key];
                if (mv) {
                    const valueTransition = { ...transition, ...values[key]?.transition };
                    const delay = typeof valueTransition.delay === 'function' ? valueTransition.delay(i, Object.keys(values).length) : valueTransition.delay;

                    animate({
                        from: mv.get(),
                        to: Array.isArray(values[key]) ? values[key][values[key].length - 1] : values[key],
                        ...valueTransition,
                        delay,
                        onUpdate: latest => mv.set(latest),
                        onComplete: () => resolve(null)
                    });
                } else {
                    resolve(null);
                }
            }));
            Promise.all(animations).then(() => onComplete?.());
        }, [motionValues, transition, reducedMotion]);

        useLayoutEffect(() => {
            const element = ref.current;
            if (!element) return;

            const unsubscribes = Object.entries(motionValues).map(([key, mv]) => mv.onChange(latest => {
                if (isSVG) {
                    if (key === 'pathLength' || key === 'pathOffset') {
                        const pathLength = motionValues['pathLength']?.get();
                        const pathOffset = motionValues['pathOffset']?.get();
                        element.setAttribute('stroke-dasharray', `${pathLength} ${pathLength}`);
                        element.setAttribute('stroke-dashoffset', String(pathOffset));
                    } else {
                        element.setAttribute(key, latest);
                    }
                } else if (key.startsWith('--')) {
                    element.style.setProperty(key, latest);
                } else if (key === "x" || key === "y" || key === "scale" || key === "rotate") {
                    const x = motionValues.x?.get() || 0;
                    const y = motionValues.y?.get() || 0;
                    const scale = motionValues.scale?.get() ?? 1;
                    const rotate = motionValues.rotate?.get() || 0;
                    element.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;
                } else {
                    (element.style as any)[key] = latest;
                }
            }));
            return () => unsubscribes.forEach(unsub => unsub());
        }, [motionValues, ref, isSVG]);

        useLayoutEffect(() => {
            if (isSVG && motionValues.pathLength && ref.current) {
                motionValues.pathLength.set((ref.current as SVGPathElement).getTotalLength());
            }
        }, [ref, isSVG, motionValues.pathLength]);

        useEffect(() => {
            if (isInView && whileInView) {
                runAnimation(whileInView);
            }
        }, [isInView, whileInView, runAnimation]);

        useEffect(() => {
            if (!presence && !isMounted.current) {
                runAnimation(initial);
            } else if (presence?.isPresent && isMounted.current) {
                runAnimation(animateProps);
            } else if (_isExiting) {
                runAnimation(exit, () => presence?.onExitComplete?.(props.key!));
            }
            if (!isMounted.current) isMounted.current = true;
        }, [presence, _isExiting, animateProps, initial, exit, runAnimation, props.key]);

        const [isHovering, setIsHovering] = useState(false);
        const [isTapping, setIsTapping] = useState(false);
        const [isFocusing, setIsFocusing] = useState(false);

        onMouseEnter(ref, () => {
            setIsHovering(true);
            if (whileHover) runAnimation(whileHover);
        });
        onMouseLeave(ref, () => {
            setIsHovering(false);
            if (!isTapping && !isFocusing) runAnimation(animateProps);
        });
        onPointerDown(ref, () => {
            setIsTapping(true);
            if (whileTap) runAnimation(whileTap);
        });
        onPointerUp(ref, () => {
            setIsTapping(false);
            if (!isHovering && !isFocusing) runAnimation(animateProps);
            else if (isHovering && whileHover) runAnimation(whileHover);
            else if (isFocusing && whileFocus) runAnimation(whileFocus);
        });
        onFocus(ref, () => {
            setIsFocusing(true);
            if (whileFocus) runAnimation(whileFocus);
        });
        onBlur(ref, () => {
            setIsFocusing(false);
            if (!isTapping && !isHovering) runAnimation(animateProps);
        });

        usePanGesture(ref, { drag, dragConstraints, onDragStart, onDrag, onDragEnd, dragMomentum: props.dragMomentum, dragTransition: props.dragTransition }, motionValues);
        useLayoutAnimation(ref, layoutId, layout);

        return (
            <Component
                ref={ref as any}
                style={{ ...style, cursor: drag ? "grab" : "auto" }}
                {...(rest as P)}
            />
        );
    });
};

type MotionFactory = {
    [Tag in keyof (JSX.IntrinsicElements & JSX.IntrinsicElements)]: React.ForwardRefExoticComponent<
        MotionComponentProps & React.RefAttributes<any>
    >;
};

const factory = new Proxy(
    {},
    {
        get: (target, prop: string) => {
            return motionComponent(React.forwardRef((props, ref) => React.createElement(prop, { ...props, ref })), svgTags.has(prop));
        },
    }
);

export const motion = factory as MotionFactory;

export const useText = (text: string, splitBy: "char" | "word" | "line" = "char") => {
    return useMemo(() => {
        let parts: string[];
        if (splitBy === 'line') {
            parts = text.split('\n');
        } else if (splitBy === 'word') {
            parts = text.split(' ');
        } else {
            parts = Array.from(text);
        }
        return parts.map((part, i) => <motion.span key={i} style={{ display: 'inline-block' }}>{part}{splitBy === 'word' ? ' ' : ''}</motion.span>);
    }, [text, splitBy]);
}

export const Reorder = {
    Group: ({ children, values, onReorder }: { children: React.ReactNode, values: any[], onReorder: (newOrder: any[]) => void }) => {
        const positions = useRef(new Map()).current;
        const register = (value: any, y: MotionValue) => positions.set(value, y);
        const unregister = (value: any) => positions.delete(value);

        const handleReorder = (from: number, to: number) => {
            const newValues = [...values];
            const [moved] = newValues.splice(from, 1);
            newValues.splice(to, 0, moved);
            onReorder(newValues);
        };

        return (
            <LayoutGroup>
                <ReorderContext.Provider value={{ onReorder: handleReorder, register, unregister }}>
                    {children}
                </ReorderContext.Provider>
            </LayoutGroup>
        );
    },
    Item: ({ children, value, ...props }: { children: React.ReactNode, value: any } & MotionComponentProps) => {
        const y = useMotionValue(0);
        const reorderContext = useContext(ReorderContext);

        useEffect(() => {
            reorderContext?.register(value, y);
            return () => reorderContext?.unregister(value);
        }, [value, y, reorderContext]);

        return (
            <motion.div layoutId={value} drag="y" style={{ y }} onDragEnd={() => {
                // Implement reorder logic on drag end
            }} {...props}>
                {children}
            </motion.div>
        );
    }
};
