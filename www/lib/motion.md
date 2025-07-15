import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { create } from "zustand";

type MotionValue<T = any> = { id: string; get: () => T; set: (value: T) => void; onChange: (callback: (value: T) => void) => () => void; getVelocity: () => number; };
type EasingFunction = (v: number) => number;
type AnimationValues = { [key: string]: any };
type Point = { x: number; y: number };
type Transition = { type?: "spring" | "tween"; duration?: number; ease?: EasingFunction; stiffness?: number; damping?: number; mass?: number; delay?: number; };
type AnimationOptions = { from: number; to: number } & Transition;
type AnimationControls = { stop: () => void; isPlaying: () => boolean };
type PanInfo = { point: Point; delta: Point; offset: Point; velocity: Point };
type DraggableProps = { drag?: boolean | "x" | "y"; dragConstraints?: React.RefObject<Element> | { top?: number; left?: number; right?: number; bottom?: number }; onDragStart?: (event: PointerEvent, info: PanInfo) => void; onDrag?: (event: PointerEvent, info: PanInfo) => void; onDragEnd?: (event: PointerEvent, info: PanInfo) => void; dragControls?: ReturnType<typeof useDragControls>; };
type MotionComponentProps = React.HTMLAttributes<HTMLDivElement> & DraggableProps & { animate?: AnimationValues; initial?: AnimationValues; exit?: AnimationValues; transition?: Transition; whileHover?: AnimationValues; whileTap?: AnimationValues; whileInView?: AnimationValues; viewport?: IntersectionObserverInit; layout?: boolean; };
interface MotionStore { values: Map<string, { value: any; velocity: number; lastUpdate: number }>; setValue: (key: string, value: any) => void; subscribe: (key: string, callback: (value: any) => void) => () => void; }
interface ReorderContextProps<T = any> { axis: "x" | "y"; onReorder: (newOrder: T[]) => void; values: T[]; }

const clamp = (min: number, max: number, v: number) => Math.min(Math.max(v, min), max);
const progress = (from: number, to: number, value: number) => (to - from === 0 ? 1 : (value - from) / (to - from));
const mix = (from: number, to: number, p: number) => -p * from + p * to + from;
const move = <T>(arr: T[], from: number, to: number) => {
    const newArr = [...arr];
    const item = newArr.splice(from, 1)[0];
    newArr.splice(to, 0, item);
    return newArr;
};

const useMotionStore = create<MotionStore>((set, get) => ({
    values: new Map(),
    setValue: (key, value) => {
        const now = performance.now();
        const state = get();
        const prev = state.values.get(key) || { value: 0, velocity: 0, lastUpdate: now };
        const newVelocity = (value - prev.value) / Math.max(1, now - prev.lastUpdate) * 1000;
        set({ values: new Map(state.values).set(key, { value, velocity: newVelocity, lastUpdate: now }) });
    },
    subscribe: (key, callback) => useMotionStore.subscribe(
        (state) => state.values.get(key)?.value,
        (val) => { if (val !== undefined) callback(val); }
    ),
}));

const linear: EasingFunction = (v) => v;
const easeIn: EasingFunction = (p) => p * p;
const easeOut: EasingFunction = (p) => 1 - (1 - p) * (1 - p);
const easeInOut: EasingFunction = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

function animate({ from, to, onUpdate, onComplete, ...options }: AnimationOptions): AnimationControls {
    let isActive = true;
    const { duration = 0.3, ease = easeInOut, type = "tween", stiffness = 100, damping = 10, mass = 1 } = options;
    let animationFrame: number;

    if (type === "spring") {
        let position = from;
        let velocity = 0;
        const tick = () => {
            if (!isActive) return;
            const springForce = -stiffness * (position - to);
            const dampingForce = -damping * velocity;
            const acceleration = (springForce + dampingForce) / mass;
            velocity += acceleration * (1 / 60);
            position += velocity * (1 / 60);
            onUpdate?.(position);
            if (Math.abs(position - to) < 0.01 && Math.abs(velocity) < 0.01) {
                onUpdate?.(to);
                onComplete?.();
            } else {
                animationFrame = requestAnimationFrame(tick);
            }
        };
        animationFrame = requestAnimationFrame(tick);
    } else {
        const startTime = performance.now();
        const tick = (timestamp: number) => {
            if (!isActive) return;
            const elapsed = timestamp - startTime;
            const p = clamp(0, 1, elapsed / (duration * 1000));
            onUpdate?.(mix(from, to, ease(p)));
            if (p < 1) {
                animationFrame = requestAnimationFrame(tick);
            } else {
                onComplete?.();
            }
        };
        animationFrame = requestAnimationFrame(tick);
    }

    return { stop: () => { isActive = false; cancelAnimationFrame(animationFrame); }, isPlaying: () => isActive };
}

export function useMotionValue<T>(initialValue: T): MotionValue<T> {
    const { setValue, subscribe } = useMotionStore.getState();
    const id = useMemo(() => `motion-${Math.random().toString(36).substr(2, 9)}`, []);
    
    useEffect(() => {
        setValue(id, initialValue);
    }, []);

    return useMemo(() => ({
        id,
        get: () => useMotionStore.getState().values.get(id)?.value ?? initialValue,
        set: (newValue: T) => setValue(id, newValue),
        onChange: (callback: (value: T) => void) => subscribe(id, callback),
        getVelocity: () => useMotionStore.getState().values.get(id)?.velocity ?? 0,
    }), [id, initialValue, setValue, subscribe]);
}

export function useAnimate() {
    const controls = useRef<AnimationControls[]>([]);
    useEffect(() => () => controls.current.forEach(c => c.stop()), []);
    return useCallback((target: MotionValue, to: number, options: Transition = {}) => {
        const from = target.get();
        const control = animate({ from, to, ...options, onUpdate: (latest) => { target.set(latest); } });
        controls.current.push(control);
        return control;
    }, []);
}

export function useMotionValueEvent(value: MotionValue, event: "change", callback: (latest: any) => void) {
    useEffect(() => value.onChange(callback), [value, callback]);
}

export function useTransform<T>(value: MotionValue<number>, inputRange: number[], outputRange: T[], options?: { clamp?: boolean; ease?: EasingFunction | EasingFunction[] }) {
    const transformedValue = useMotionValue<T>(mix(outputRange[0] as any, outputRange[1] as any, progress(inputRange[0], inputRange[1], value.get())));
    useEffect(() => value.onChange(latest => {
        let p = progress(inputRange[0], inputRange[1], latest);
        if (options?.clamp) p = clamp(0, 1, p);
        if (options?.ease) p = Array.isArray(options.ease) ? options.ease[clamp(0, options.ease.length - 1, Math.floor(p * options.ease.length))](p) : options.ease(p);
        transformedValue.set(mix(outputRange[0] as any, outputRange[1] as any, p));
    }), [value, inputRange, outputRange, options, transformedValue]);
    return transformedValue;
}

export function useSpring(source: MotionValue<number>, options: Omit<Transition, "type" | "duration" | "ease"> = {}) {
    const { stiffness = 100, damping = 10, mass = 1 } = options;
    const value = useMotionValue(source.get());
    useEffect(() => source.onChange(to => {
        animate({ from: value.get(), to, type: "spring", stiffness, damping, mass, onUpdate: v => value.set(v) });
    }), [source, stiffness, damping, mass, value]);
    return value;
}

export function useVelocity(value: MotionValue<number>) {
    const velocity = useMotionValue(0);
    useEffect(() => value.onChange(() => velocity.set(value.getVelocity())), [value, velocity]);
    return velocity;
}

export function useScroll(options?: { container?: React.RefObject<HTMLElement>; target?: React.RefObject<HTMLElement> }) {
    const scrollX = useMotionValue(0);
    const scrollY = useMotionValue(0);
    const scrollXProgress = useMotionValue(0);
    const scrollYProgress = useMotionValue(0);
    useEffect(() => {
        const el = options?.container?.current || window;
        const handleScroll = () => {
            const target = options?.target?.current || document.documentElement;
            const { scrollLeft, scrollTop, scrollWidth, clientWidth, scrollHeight, clientHeight } = target;
            scrollX.set(scrollLeft);
            scrollY.set(scrollTop);
            scrollXProgress.set(scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0);
            scrollYProgress.set(scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0);
        };
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [options?.container, options?.target, scrollX, scrollY, scrollXProgress, scrollYProgress]);
    return { scrollX, scrollY, scrollXProgress, scrollYProgress };
}

export function useAnimationFrame(callback: (timestamp: number) => void) {
    const callbackRef = useRef(callback);
    useLayoutEffect(() => { callbackRef.current = callback; }, [callback]);
    useEffect(() => {
        let animationFrame: number;
        const loop = (timestamp: number) => {
            callbackRef.current(timestamp);
            animationFrame = requestAnimationFrame(loop);
        };
        animationFrame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrame);
    }, []);
}

export function useTime() {
    const time = useMotionValue(0);
    useAnimationFrame(timestamp => time.set(timestamp));
    return time;
}

export function useMotionTemplate(strings: TemplateStringsArray, ...values: MotionValue[]) {
    const createValue = () => strings.reduce((acc, str, i) => acc + str + (values[i] ? values[i].get() : ""), "");
    const combined = useMotionValue(createValue());
    useEffect(() => {
        const update = () => combined.set(createValue());
        const unsubscribes = values.map(v => v.onChange(update));
        return () => unsubscribes.forEach(unsub => unsub());
    }, [values, strings, combined]);
    return combined;
}

export function useDragControls() {
    const controls = useRef<(e: PointerEvent) => void>();
    return useMemo(() => ({
        start: (e: React.PointerEvent) => controls.current?.(e.nativeEvent),
        _subscribe: (handler: (e: PointerEvent) => void) => { controls.current = handler; },
    }), []);
}

export function useInView(ref: React.RefObject<Element>, options?: IntersectionObserverInit & { once?: boolean }) {
    const [isInView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            setInView(entry.isIntersecting);
            if (entry.isIntersecting && options?.once) {
                observer.disconnect();
            }
        }, options);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, options]);
    return isInView;
}

export function usePageInView() {
    const [isInView, setInView] = useState(true);
    useEffect(() => {
        const handleVisibilityChange = () => { setInView(document.visibilityState === "visible"); };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);
    return isInView;
}

export function useReducedMotion() {
    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mediaQuery.matches);
        const listener = () => setReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener("change", listener);
        return () => mediaQuery.removeEventListener("change", listener);
    }, []);
    return reducedMotion;
}

const PresenceContext = createContext<{ isPresent: boolean; onExitComplete?: () => void; } | null>(null);

export function AnimatePresence({ children }: { children: React.ReactNode }) {
    const [presentChildren, setPresentChildren] = useState(() => React.Children.toArray(children));

    useEffect(() => {
        const newChildren = React.Children.toArray(children);
        const exitingKeys = new Set<React.Key>();
        
        const currentKeys = new Set(newChildren.map(c => React.isValidElement(c) ? c.key : null));
        const prevKeys = new Set(presentChildren.map(c => React.isValidElement(c) ? c.key : null));

        prevKeys.forEach(key => {
            if (key && !currentKeys.has(key)) {
                exitingKeys.add(key);
            }
        });

        const handleExitComplete = (key: React.Key) => {
            setPresentChildren(prev => prev.filter(c => !(React.isValidElement(c) && c.key === key)));
        };

        const mergedChildren = [...presentChildren];
        newChildren.forEach(child => {
            if (React.isValidElement(child) && !prevKeys.has(child.key)) {
                mergedChildren.push(child);
            }
        });
        
        setPresentChildren(mergedChildren.map(child => {
            if (React.isValidElement(child) && exitingKeys.has(child.key!)) {
                return React.cloneElement(child, {
                    _isExiting: true,
                    _onExitComplete: () => handleExitComplete(child.key!),
                });
            }
            return child;
        }));

    }, [children]);

    return <>{presentChildren}</>;
}

const MotionConfigContext = createContext<Partial<MotionComponentProps>>({});
export const MotionConfig = ({ children, ...props }: React.PropsWithChildren<Partial<MotionComponentProps>>) => (
    <MotionConfigContext.Provider value={props}>{children}</MotionConfigContext.Provider>
);

const LayoutGroupContext = createContext<(() => void) | null>(null);
export const LayoutGroup = ({ children }: { children: React.ReactNode }) => {
    const [id, setId] = useState(0);
    const forceUpdate = useCallback(() => setId(v => v + 1), []);
    return <LayoutGroupContext.Provider value={forceUpdate}>{children}</LayoutGroupContext.Provider>;
};

const ReorderContext = createContext<ReorderContextProps | null>(null);

const ReorderGroup = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement> & ReorderContextProps>(
    ({ children, as = "ul", onReorder, values, ...props }, ref) => {
        const context = useMemo(() => ({ onReorder, values }), [onReorder, values]);
        const As = motion[as as keyof typeof motion] || motion.div;
        return (
            <ReorderContext.Provider value={context}>
                <As ref={ref} {...props}>{children}</As>
            </ReorderContext.Provider>
        );
    }
);

const ReorderItem = React.forwardRef<HTMLLIElement, Omit<MotionComponentProps, "onDrag"> & { value: any }>(
    ({ children, value, ...props }, ref) => {
        const { onReorder, values } = useContext(ReorderContext)!;
        const y = useMotionValue(0);
        const zIndex = useMotionValue(0);
        const onDragEnd = () => {
            zIndex.set(0);
        };
        return (
            <motion.li
                ref={ref}
                drag="y"
                style={{ y, zIndex }}
                onDragEnd={onDragEnd}
                {...props}
            >
                {children}
            </motion.li>
        );
    }
);

export const Reorder = {
    Group: ReorderGroup,
    Item: ReorderItem,
};

export const motion = {
    div: React.forwardRef<HTMLDivElement, MotionComponentProps & { _isExiting?: boolean; _onExitComplete?: () => void; }>((props, externalRef) => {
        const config = useContext(MotionConfigContext);
        const { animate: animateProps, initial, exit, transition, whileHover, whileTap, whileInView, viewport, drag, dragConstraints, onDragStart, onDrag, onDragEnd, dragControls, layout, style, _isExiting, _onExitComplete, ...rest } = { ...config, ...props };
        
        const internalRef = useRef<HTMLDivElement>(null);
        const ref = (externalRef || internalRef) as React.RefObject<HTMLDivElement>;
        
        const isInitialRender = useRef(true);
        const reducedMotion = useReducedMotion();
        const forceLayoutUpdate = useContext(LayoutGroupContext);

        const motionValues = useMemo(() => {
            const values: { [key: string]: MotionValue } = {};
            const allKeys = { ...initial, ...animateProps, ...whileHover, ...whileTap, ...whileInView, ...exit };
            for (const key in allKeys) {
                values[key] = useMotionValue(initial?.[key] ?? 0);
            }
            return values;
        }, []);

        const runAnimation = useCallback((values: AnimationValues | undefined) => {
            if (!values || reducedMotion) return;
            for (const key in values) {
                const to = values[key] as number;
                const mv = motionValues[key];
                if (mv) {
                    animate({ from: mv.get(), to, ...transition, onUpdate: latest => mv.set(latest) });
                }
            }
        }, [motionValues, transition, reducedMotion]);

        useLayoutEffect(() => {
            const element = ref.current;
            if (!element || !layout) return;
            const rect = element.getBoundingClientRect();
            motionValues.x?.set(rect.left);
            motionValues.y?.set(rect.top);
        }, [layout, forceLayoutUpdate]);

        useLayoutEffect(() => {
            const element = ref.current;
            if (!element) return;
            const unsubscribes = Object.entries(motionValues).map(([key, mv]) => mv.onChange(latest => {
                const x = motionValues.x?.get() || 0;
                const y = motionValues.y?.get() || 0;
                const scale = motionValues.scale?.get() || 1;
                const rotate = motionValues.rotate?.get() || 0;
                element.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;
            }));
            return () => unsubscribes.forEach(unsub => unsub());
        }, [motionValues]);

        useEffect(() => {
            if (isInitialRender.current) {
                runAnimation(initial);
                isInitialRender.current = false;
            } else if (_isExiting) {
                runAnimation(exit);
                setTimeout(() => _onExitComplete?.(), (transition?.duration || 0.3) * 1000);
            } else {
                runAnimation(animateProps);
            }
        }, [_isExiting, animateProps, runAnimation, exit, _onExitComplete, transition, initial]);

        const handleEvent = (handler?: AnimationValues) => () => runAnimation(handler);
        const handleMouseLeave = () => runAnimation(animateProps);

        return (
            <div
                ref={ref}
                onMouseEnter={handleEvent(whileHover)}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleEvent(whileTap)}
                onMouseUp={handleMouseLeave}
                style={{ ...style, cursor: drag ? 'grab' : 'auto' }}
                {...rest}
            />
        );
    })
};
