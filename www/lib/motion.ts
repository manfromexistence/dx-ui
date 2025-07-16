"use client";

import { useMemo, useEffect, useCallback, useRef, useState, useLayoutEffect, createContext, useContext } from "react";
import { create } from "zustand";

// --- dx-motion Core ---

export type MotionValue<T = any> = {
    id: string;
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => () => void;
    getVelocity: () => number;
};
export type EasingFunction = (v: number) => number;
export type AnimationValues = { [key: string]: any | any[] };
export type Point = { x: number; y: number };
export type Transition = { type?: "spring" | "tween" | "inertia" | "physics"; duration?: number; ease?: EasingFunction | [number, number, number, number] | "bounce" | "bounceIn" | "bounceOut" | "bounceInOut" | "wiggle"; stiffness?: number; damping?: number; mass?: number; delay?: number | ((i: number) => number); onComplete?: () => void; power?: number; timeConstant?: number; modifyTarget?: (v: number) => number; acceleration?: number; friction?: number; };
export type AnimationOptions = { from: any; to: any; onUpdate?: (latest: any) => void; velocity?: number } & Transition;
export type AnimationControls = { stop: () => void; isPlaying: () => boolean; play: () => void; pause: () => void; reverse: () => void; seek: (time: number) => void; timeScale: (scale: number) => void;};
export type PanInfo = { point: Point; delta: Point; offset: Point; velocity: Point };
export type DraggableProps = { drag?: boolean | "x" | "y"; dragConstraints?: React.RefObject<Element> | { top?: number; left?: number; right?: number; bottom?: number }; onDragStart?: (event: PointerEvent, info: PanInfo) => void; onDrag?: (event: PointerEvent, info: PanInfo) => void; onDragEnd?: (event: PointerEvent, info: PanInfo) => void; dragControls?: ReturnType<typeof useDragControls>; dragMomentum?: boolean; dragTransition?: Transition; };
export type MotionComponentProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd"> & DraggableProps & { animate?: AnimationValues; initial?: AnimationValues; exit?: AnimationValues; transition?: Transition; whileHover?: AnimationValues; whileTap?: AnimationValues; whileFocus?: AnimationValues; whileInView?: AnimationValues; viewport?: IntersectionObserverInit & { once?: boolean }; layout?: boolean | "position" | "size"; layoutId?: string; };
interface MotionStore { values: Map<string, { value: any; velocity: number; lastUpdate: number }>; setValue: (key: string, value: any) => void; subscribe: (key: string, callback: (value: any) => void) => () => void; }

const clamp = (min: number, max: number, v: number) => Math.min(Math.max(v, min), max);
const progress = (from: number, to: number, value: number) => (to - from === 0 ? 1 : (value - from) / (to - from));
const mix = (from: number, to: number, p: number) => -p * from + p * to + from;

const colorRegex = /#(?:[0-9a-f]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)/gi;
const numberRegex = /-?\d*\.?\d+/g;

const toRGBA = (color: string): [number, number, number, number] => {
    if (color.startsWith("#")) {
        const hex = color.slice(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return [r, g, b, 1];
    }
    const [r, g, b, a = 1] = color.match(/\d+/g)!.map(Number);
    return [r, g, b, a];
};

const mixColor = (from: string, to: string, p: number) => {
    const fromRGBA = toRGBA(from);
    const toRGBA = toRGBA(to);
    const result = fromRGBA.map((v, i) => Math.round(mix(v, toRGBA[i], p)));
    return `rgba(${result[0]}, ${result[1]}, ${result[2]}, ${result[3]})`;
};

const mixComplex = (from: string, to: string, p: number) => {
    const fromNumbers = from.match(numberRegex)?.map(Number) || [];
    const toNumbers = to.match(numberRegex)?.map(Number) || [];
    const fromColors = from.match(colorRegex) || [];
    const toColors = to.match(colorRegex) || [];

    let i = 0;
    let j = 0;
    return to.replace(colorRegex, () => mixColor(fromColors[j], toColors[j++], p))
             .replace(numberRegex, () => mix(fromNumbers[i], toNumbers[i++], p).toString());
}

export const useMotionStore = create<MotionStore>((set, get) => ({
    values: new Map(),
    setValue: (key, value) => {
        const now = performance.now();
        const state = get();
        const prev = state.values.get(key) || { value: 0, velocity: 0, lastUpdate: now };
        const timeDelta = Math.max(1, now - prev.lastUpdate);
        const newVelocity = typeof value === 'number' && typeof prev.value === 'number' ? (value - prev.value) / timeDelta * 1000 : 0;
        set({ values: new Map(state.values).set(key, { value, velocity: newVelocity, lastUpdate: now }) });
    },
    subscribe: (key, callback) => {
        const unsub = useMotionStore.subscribe(
            (state) => state.values.get(key)?.value,
            (val) => { if (val !== undefined) callback(val); }
        );
        return unsub;
    },
}));

const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const ax = 3 * x1 - 3 * x2 + 1;
    const bx = 3 * x2 - 6 * x1;
    const cx = 3 * x1;
    const ay = 3 * y1 - 3 * y2 + 1;
    const by = 3 * y2 - 6 * y1;
    const cy = 3 * y1;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const solveCurveX = (x: number) => {
        let t2 = x;
        for (let i = 0; i < 8; i++) {
            const x2 = sampleCurveX(t2) - x;
            if (Math.abs(x2) < 1e-6) return t2;
            const d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
            if (Math.abs(d2) < 1e-6) break;
            t2 = t2 - x2 / d2;
        }
        return t2;
    };
    return (x: number) => sampleCurveY(solveCurveX(x));
};

const bounceOut = (p: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (p < 1 / d1) {
        return n1 * p * p;
    } else if (p < 2 / d1) {
        return n1 * (p -= 1.5 / d1) * p + 0.75;
    } else if (p < 2.5 / d1) {
        return n1 * (p -= 2.25 / d1) * p + 0.9375;
    } else {
        return n1 * (p -= 2.625 / d1) * p + 0.984375;
    }
};

export const easings = {
    linear: (v: number) => v,
    easeIn: cubicBezier(0.42, 0, 1, 1),
    easeOut: cubicBezier(0, 0, 0.58, 1),
    easeInOut: cubicBezier(0.42, 0, 0.58, 1),
    circIn: (p: number) => 1 - Math.sqrt(1 - p * p),
    circOut: (p: number) => Math.sqrt(1 - Math.pow(p - 1, 2)),
    circInOut: (p: number) => p < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * p, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * p + 2, 2)) + 1) / 2,
    backIn: (p: number) => 2.70158 * p * p * p - 1.70158 * p * p,
    backOut: (p: number) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2),
    backInOut: (p: number) => p < 0.5 ? (Math.pow(2 * p, 2) * ((2.59491) * 2 * p - 1.59491)) / 2 : (Math.pow(2 * p - 2, 2) * ((2.59491) * (p * 2 - 2) + 1.59491) + 2) / 2,
    anticipate: (p: number) => (p *= 2) < 1 ? 0.5 * (p * p * p - p * p) : 0.5 * ((p -= 2) * p * p + 2),
    bounceIn: (p: number) => 1 - bounceOut(1 - p),
    bounceOut,
    bounceInOut: (p: number) => p < 0.5 ? (1 - bounceOut(1 - 2 * p)) / 2 : (1 + bounceOut(2 * p - 1)) / 2,
    steps: (n: number, direction: "start" | "end" = "end") => (p: number) => {
        const step = Math.floor(p * n);
        return direction === "end" ? step / (n - 1) : step / n;
    },
    wiggle: (p: number, wiggles = 10) => -Math.cos(p * Math.PI * (wiggles - 0.5)) * Math.exp(-p * p * 5) + 1,
};

export function animate({ from, to, onUpdate, onComplete, velocity = 0, ...options }: AnimationOptions): AnimationControls {
    let isActive = true;
    let isReversed = false;
    let currentTime = 0;
    let scale = 1;
    const { duration = 0.3, ease: easeOption = easings.easeInOut, type = "tween", stiffness = 100, damping = 10, mass = 1, delay = 0, power = 0.8, timeConstant = 325, modifyTarget, acceleration = 0, friction = 0.1 } = options;
    let animationFrame: number;
    const ease = typeof easeOption === 'string' ? (easings as any)[easeOption] : Array.isArray(easeOption) ? cubicBezier(...easeOption) : easeOption;

    const stop = () => {
        isActive = false;
        cancelAnimationFrame(animationFrame);
    };
    
    let tick: (timestamp: number) => void;
    
    if (type === 'inertia') {
        tick = (timestamp: number) => {
            if (!isActive) return;
            const elapsed = timestamp - lastTime;
            const delta = -velocity * Math.exp(-elapsed / timeConstant);
            from += delta;
            onUpdate?.(from);
            if (Math.abs(velocity) < 1) {
                onComplete?.();
                stop();
            } else {
                velocity *= Math.exp(-elapsed / timeConstant);
                animationFrame = requestAnimationFrame(tick);
            }
            lastTime = timestamp;
        };
    } else if (type === 'physics') {
        let position = from;
        let v = velocity;
        tick = (timestamp: number) => {
            if (!isActive) return;
            const elapsed = (timestamp - lastTime) / 1000;
            v += acceleration * elapsed;
            v *= (1 - friction);
            position += v * elapsed;
            onUpdate?.(position);
            if (Math.abs(v) < 0.1) {
                stop();
                onComplete?.();
            } else {
                animationFrame = requestAnimationFrame(tick);
            }
            lastTime = timestamp;
        };
    } else {
        tick = (timestamp: number) => {
            if (!isActive) return;
            
            currentTime += (timestamp - (lastTime || timestamp)) * scale;
            lastTime = timestamp;

            const p = clamp(0, 1, currentTime / (duration * 1000));
            const easedProgress = ease(p);
            
            let latest;
            if (typeof from === 'number' && typeof to === 'number') {
                latest = mix(from, to, easedProgress);
            } else if (typeof from === 'string' && typeof to === 'string') {
                if (from.match(colorRegex) && to.match(colorRegex)) {
                    latest = mixColor(from, to, easedProgress);
                } else {
                    latest = mixComplex(from, to, easedProgress);
                }
            }
            
            onUpdate?.(latest);

            if ((!isReversed && p >= 1) || (isReversed && p <= 0)) {
                onComplete?.();
                stop();
            } else {
                animationFrame = requestAnimationFrame(tick);
            }
        };
    }


    let lastTime: number;
    const play = () => {
        isActive = true;
        lastTime = performance.now();
        animationFrame = requestAnimationFrame(tick);
    };

    const pause = () => { isActive = false; };
    const reverse = () => { isReversed = !isReversed; };
    const seek = (time: number) => { currentTime = time * 1000; };
    const timeScale = (newScale: number) => { scale = newScale; };
    
    setTimeout(play, typeof delay === 'number' ? delay * 1000 : 0);

    return { stop, isPlaying: () => isActive, play, pause, reverse, seek, timeScale };
}

export function useTimeline(sequence: [string | MotionValue, AnimationValues, Transition?][]) {
    const controls = useMemo(() => {
        const timelineControls: AnimationControls[] = [];
        let totalDuration = 0;
        
        sequence.forEach(([target, values, options]) => {
            const duration = options?.duration || 0.3;
            Object.keys(values).forEach(key => {
                const mv = typeof target === 'string' ? useMotionStore.getState().values.get(`${target}-${key}`) : target;
                if(mv) {
                    const from = mv.get();
                    const to = values[key];
                    const control = animate({
                        from, to, ...options,
                        delay: totalDuration,
                        onUpdate: (latest) => mv.set(latest),
                    });
                    timelineControls.push(control);
                }
            });
            totalDuration += duration;
        });

        return {
            play: () => timelineControls.forEach(c => c.play()),
            pause: () => timelineControls.forEach(c => c.pause()),
            reverse: () => timelineControls.forEach(c => c.reverse()),
            seek: (time: number) => timelineControls.forEach(c => c.seek(time)),
            timeScale: (scale: number) => timelineControls.forEach(c => c.timeScale(scale)),
        };
    }, [sequence]);
    return controls;
}

export function useMotionValue<T>(initialValue: T): MotionValue<T> {
    const store = useMotionStore.getState();
    const id = useMemo(() => `motion-${Math.random().toString(36).substr(2, 9)}`, []);
    
    useEffect(() => {
        store.setValue(id, initialValue);
    }, [id, initialValue, store]);

    return useMemo(() => ({
        id,
        get: () => useMotionStore.getState().values.get(id)?.value ?? initialValue,
        set: (newValue: T) => store.setValue(id, newValue),
        onChange: (callback: (value: T) => void) => store.subscribe(id, callback),
        getVelocity: () => useMotionStore.getState().values.get(id)?.velocity ?? 0,
    }), [id, initialValue, store]);
}

export function useTransform<T, U>(
    value: MotionValue<T>,
    transformer: ((v: T) => U) | number[],
    outputRange?: U[]
): MotionValue<U> {
    const initialTransformedValue = () => {
        const latest = value.get();
        if (typeof transformer === 'function') {
            return transformer(latest);
        }
        if (Array.isArray(transformer) && outputRange) {
            const p = progress(transformer[0], transformer[1], latest as any);
            return mix(outputRange[0] as any, outputRange[1] as any, p);
        }
        return latest as any;
    };
    
    const transformedValue = useMotionValue(initialTransformedValue());

    useEffect(() => {
        const unsubscribe = value.onChange(latest => {
            let newValue;
            if (typeof transformer === "function") {
                newValue = transformer(latest);
            } else if (Array.isArray(transformer) && outputRange) {
                const p = progress(transformer[0] as number, transformer[1] as number, latest as any);
                newValue = mix(outputRange[0] as any, outputRange[1] as any, p);
            }
            if (newValue !== undefined) {
                transformedValue.set(newValue);
            }
        });
        return () => unsubscribe();
    }, [value, transformer, outputRange, transformedValue]);

    return transformedValue;
}

export function useScroll(options?: { container?: React.RefObject<HTMLElement> }) {
    const scrollX = useMotionValue(0);
    const scrollY = useMotionValue(0);
    const scrollXProgress = useMotionValue(0);
    const scrollYProgress = useMotionValue(0);
    const scrollXVelocity = useMotionValue(0);
    const scrollYVelocity = useMotionValue(0);

    useEffect(() => {
        const element = options?.container?.current || window;
        const handleScroll = () => {
            const x = 'scrollX' in element ? element.scrollX : element.scrollLeft;
            const y = 'scrollY' in element ? element.scrollY : element.scrollTop;
            scrollX.set(x);
            scrollY.set(y);
            scrollXVelocity.set(scrollX.getVelocity());
            scrollYVelocity.set(scrollY.getVelocity());
            const scrollWidth = 'scrollWidth' in element ? (element as HTMLElement).scrollWidth : document.documentElement.scrollWidth;
            const clientWidth = 'clientWidth' in element ? (element as HTMLElement).clientWidth : document.documentElement.clientWidth;
            const scrollHeight = 'scrollHeight' in element ? (element as HTMLElement).scrollHeight : document.documentElement.scrollHeight;
            const clientHeight = 'clientHeight' in element ? (element as HTMLElement).clientHeight : document.documentElement.clientHeight;
            scrollXProgress.set(x / (scrollWidth - clientWidth));
            scrollYProgress.set(y / (scrollHeight - clientHeight));
        };
        
        element.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Set initial values
        return () => element.removeEventListener('scroll', handleScroll);
    }, [options?.container, scrollX, scrollY, scrollXProgress, scrollYProgress, scrollXVelocity, scrollYVelocity]);

    return { scrollX, scrollY, scrollXProgress, scrollYProgress, scrollXVelocity, scrollYVelocity };
}

export function useScrollTo(options?: Transition) {
    return useCallback((target: number | string | HTMLElement) => {
        let targetY: number;
        if (typeof target === 'number') {
            targetY = target;
        } else if (typeof target === 'string') {
            const el = document.querySelector(target);
            if (!el) return;
            targetY = window.scrollY + el.getBoundingClientRect().top;
        } else {
            targetY = window.scrollY + target.getBoundingClientRect().top;
        }

        animate({
            from: window.scrollY,
            to: targetY,
            onUpdate: (v) => window.scrollTo(0, v),
            ...options,
        });
    }, [options]);
}

export function useSmoothScroll(options?: { stiffness?: number, damping?: number, mass?: number }) {
    const { stiffness = 100, damping = 10, mass = 1 } = options || {};
    const smoothedScrollY = useMotionValue(window.scrollY);

    useEffect(() => {
        let animationFrame: number;
        const tick = () => {
            const current = smoothedScrollY.get();
            const target = window.scrollY;
            const newPosition = mix(current, target, 1 / (stiffness / 10)); // Simplified spring
            smoothedScrollY.set(newPosition);
            animationFrame = requestAnimationFrame(tick);
        };
        animationFrame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrame);
    }, [smoothedScrollY, stiffness, damping, mass]);
    
    return smoothedScrollY;
}


export function stagger(duration: number, options: { start?: number, from?: "first" | "last" | "center", ease?: EasingFunction } = {}) {
    const { start = 0, from = "first", ease } = options;
    return (i: number, total: number) => {
        const fromIndex = from === "first" ? 0 : from === "last" ? total - 1 : Math.floor(total / 2);
        const distance = Math.abs(i - fromIndex);
        let p = progress(0, total - 1, distance);
        if (ease) p = ease(p);
        return start + p * duration;
    };
}

export function useMotionPath(pathRef: React.RefObject<SVGPathElement>, progress: MotionValue<number>) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    useLayoutEffect(() => {
        if (!pathRef.current) return;
        const path = pathRef.current;
        const pathLength = path.getTotalLength();
        
        const unsubscribe = progress.onChange(p => {
            const point = path.getPointAtLength(p * pathLength);
            x.set(point.x);
            y.set(point.y);
        });

        return () => unsubscribe();
    }, [pathRef, progress, x, y]);

    return { x, y };
}

export function useInView(ref: React.RefObject<Element>, options: IntersectionObserverInit & { once?: boolean } = {}) {
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
            if (entry.isIntersecting && options.once) {
                observer.disconnect();
            }
        }, options);

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [ref, options]);

    return isInView;
}

export function useObserver(
    ref: React.RefObject<Element>, 
    options: { onEnter?: () => void; onLeave?: () => void; onResize?: (entry: ResizeObserverEntry) => void; } & IntersectionObserverInit
) {
    const { onEnter, onLeave, onResize, ...intersectionOptions } = options;

    useEffect(() => {
        if (!ref.current) return;
        const intersectionObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                onEnter?.();
            } else {
                onLeave?.();
            }
        }, intersectionOptions);
        
        intersectionObserver.observe(ref.current);

        let resizeObserver: ResizeObserver;
        if (onResize) {
            resizeObserver = new ResizeObserver(([entry]) => {
                onResize(entry);
            });
            resizeObserver.observe(ref.current);
        }

        return () => {
            intersectionObserver.disconnect();
            resizeObserver?.disconnect();
        };
    }, [ref, onEnter, onLeave, onResize, intersectionOptions]);
}

export function useChain(refs: React.MutableRefObject<AnimationControls[]>[], timeStep: number = 0.1) {
    useEffect(() => {
        refs.forEach((ref, i) => {
            setTimeout(() => {
                ref.current.forEach(control => control.play());
            }, i * timeStep * 1000);
        });
    }, [refs, timeStep]);
};

export function useTrail<T extends any[]>(items: T, options: Transition & { from: AnimationValues, to: AnimationValues }) {
    const { from, to, ...transitionOptions } = options;
    return items.map((_, i) => {
        const style = useMotionValue(from);
        useMemo(() => animate({
            from: 0,
            to: 1,
            ...transitionOptions,
            delay: i * (typeof options.delay === 'number' ? options.delay : 0.1),
            onUpdate: (p) => {
                const newStyle: any = {};
                for (const key in to) {
                    const fromVal = from?.[key] ?? 0;
                    const toVal = to?.[key] ?? 1;
                    newStyle[key] = mix(fromVal, toVal, p);
                }
                style.set(newStyle);
            }
        }), [i, options, style]);
        return style;
    });
};

export function useTransition<T extends any>(items: T[], keyAccessor: (item: T) => string, options: { from: AnimationValues; enter: AnimationValues; leave: AnimationValues; trail?: number; } & Transition) {
    const [transitions, setTransitions] = useState<{ key: string; item: T; style: any; }[]>([]);
    const { from, enter, leave, trail, ...restOptions } = options;

    useLayoutEffect(() => {
        const newKeys = new Set(items.map(keyAccessor));
        const oldTransitions = new Map(transitions.map(t => [t.key, t]));
        
        const newTransitionsWithItems = items.map(item => {
            const key = keyAccessor(item);
            const old = oldTransitions.get(key);
            if (old) {
                oldTransitions.delete(key);
                return old;
            }
            const style = useMotionValue(from);
            animate({from: 0, to: 1, ...restOptions, onUpdate: p => {
                const newStyle: any = {};
                for (const k in enter) {
                    newStyle[k] = mix(from[k], enter[k], p);
                }
                style.set(newStyle);
            }});
            return { key, item, style };
        });

        oldTransitions.forEach(t => {
            animate({from: 1, to: 0, ...restOptions, onUpdate: p => {
                const newStyle: any = {};
                for (const k in leave) {
                    newStyle[k] = mix(enter[k], leave[k], p);
                }
                t.style.set(newStyle);
            }, onComplete: () => {
                setTransitions(current => current.filter(ct => ct.key !== t.key));
            }});
        });

        setTransitions(newTransitionsWithItems);

    }, [items, keyAccessor, from, enter, leave, restOptions]);

    return transitions;
};

export const useDragControls = () => {
    return useMemo(() => ({ start: (e: React.PointerEvent) => {} }), []);
}

export const useReducedMotion = () => {
    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mediaQuery.matches);
        const listener = () => setReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener("change", listener);
        return () => mediaQuery.removeEventListener("change", listener);
    }, []);
    return reducedMotion;
}
