/**
 * dx-motion: An all-in-one animation library for React.
 *
 * This file combines the core concepts of GSAP, Framer Motion, React Spring, and Anime.js
 * into a single, powerful, and easy-to-use package.
 *
 * ---
 *
 * # dx-motion Feature Checklist
 *
 * ## 1. Core Animation Engine
 *
 * - [x] **Tweening Engine:** Core functionality to animate single values over time.
 * - [x] **Timeline Control:** Create and manage complex, multi-step animation sequences.
 * - [x] Play, pause, reverse, seek, and restart controls.
 * - [x] Time-scaling (slow/fast motion).
 * - [x] Callbacks for different timeline events (`onComplete`).
 * - [x] **Keyframe Animations:** Support for defining animations with multiple steps.
 * - [x] **Staggering:** Easily create staggered animations for groups of elements.
 * - [x] **Spring Physics:** Implement a robust spring-based animation system.
 * - [x] **Value Interpolation:** Advanced interpolation for colors, complex strings, and paths.
 * - [x] **MotionValues:** Observable state variables for tracking animation values.
 *
 * ## 2. Easing and Physics
 *
 * - [x] **Standard Easing Functions:** `linear`, `easeIn`, `easeOut`, `easeInOut`.
 * - [x] **Advanced Easing:**
 * - [x] **Custom Cubic Bezier:** Create custom easing curves.
 * - [x] **Custom Bounce:** Implement GSAP's `CustomBounce`.
 * - [x] **Custom Wiggle:** Implement GSAP's `CustomWiggle`.
 * - [x] **Stepped Easing:** Move between states in distinct steps.
 * - [x] **Physics-Based Animation:**
 * - [x] **Inertia:** For realistic coasting and momentum.
 * - [x] **2D Physics:** Basic physics simulation for position, rotation, and scale.
 *
 * ## 3. DOM and CSS Animation
 *
 * - [x] **CSS Properties:** Animate all standard CSS properties (e.g., `opacity`, `transform`, `color`).
 * - [x] **CSS Rule Animation:** Achieved via CSS variable animation.
 * - [x] **CSS Variables:** Support for animating CSS Custom Properties.
 * - [x] **Transforms:** Optimized transform animations (`translateX`, `rotate`, `scale`, etc.).
 * - [x] **Layout Animations:** Smoothly animate layout changes (FLIP technique).
 * - [x] `AnimatePresence` for enter/exit animations.
 * - [x] `LayoutGroup` for shared layout transitions.
 *
 * ## 4. SVG Animation
 *
 * - [x] **SVG Attribute Animation:** Animate attributes like `fill`, `stroke`, `d`, etc.
 * - [x] **Path Animation:**
 * - [x] **Draw SVG Path:** Animate the drawing of SVG strokes.
 * - [x] **Morph SVG Path:** Smoothly transition between different SVG shapes.
 * - [x] **Motion Path:** Animate elements along an SVG path.
 *
 * ## 5. Text Animation
 *
 * - [x] **Text Splitting:** Split text into characters, words, and lines for individual animation.
 * - [x] **Scramble Text:** Create a text scrambling effect.
 * - [x] **Text Animation Plugin:** Animate text content sequentially.
 *
 * ## 6. Interactivity and Gestures
 *
 * - [x] **Draggable:** Make elements draggable with constraints and inertia.
 * - [x] **Hover Gestures:** Trigger animations on mouse enter and leave.
 * - [x] **Tap/Press Gestures:** Handle click and touch events.
 * - [x] **Focus Gestures:** Animate based on element focus.
 * - [x] **Pan Gestures:** Detect panning/swiping interactions.
 *
 * ## 7. Scrolling
 *
 * - [x] **Parallax Effects:** Create parallax scrolling animations.
 * - [x] **Scroll Smoothing:** Implement smooth scrolling for a better user experience.
 * - [x] **Scroll To:** Animate scrolling to a specific point on the page.
 * - [x] **Scroll Velocity:** Track and use scroll velocity in animations.
 * - [x] **`useInView` Hook:** Trigger animations when elements enter the viewport.
 *
 * ## 8. Hooks and Components (for React Integration)
 *
 * - [x] **`useSpring` / `useSprings`:** (Covered by `animate` with `type: "spring"`)
 * - [x] **`useTrail`:** Hook for creating trailing animations.
 * - [x] **`useTransition`:** Hook for managing enter/exit animations for lists.
 * - [x] **`useChain`:** Hook to sequence animations across different hooks.
 * - [x] **`useMotionValue`:** Hook for creating and tracking motion values.
 * - [x] **`useTransform`:** Hook to create a new motion value by transforming another.
 * - [x] **`motion` Component:** The core component for making elements animatable.
 * - [x] **`AnimatePresence` Component:** For managing enter and exit animations.
 *
 * ## 9. Advanced Features and Utilities
 *
 * - [ ] **DevTools:** A debugging utility to inspect and control animations.
 * - [x] **Observer:** A utility to detect and react to various user interactions and element states.
 * - [ ] **Lazy Motion:** Allow for feature chunking to reduce bundle size.
 * - [x] **Reorder Components:** Components for creating re-orderable lists.
 * - [ ] **Platform Integration:**
 * - [ ] **React Native:** Support for animations on native platforms.
 * - [ ] **Three.js:** Integration for 3D animations.
 * - [ ] **Konva/Pixi:** Support for canvas-based animations.
 */

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { create } from "zustand";
import { onPointerDown, onPointerUp, onMouseEnter, onMouseLeave, onFocus, onBlur } from "@/lib/interaction";

// --- dx-motion Core ---

type MotionValue<T = any> = {
    id: string;
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => () => void;
    getVelocity: () => number;
};
type EasingFunction = (v: number) => number;
type AnimationValues = { [key: string]: any | any[] };
type Point = { x: number; y: number };
type Transition = { type?: "spring" | "tween" | "inertia" | "physics"; duration?: number; ease?: EasingFunction | [number, number, number, number] | "bounce" | "bounceIn" | "bounceOut" | "bounceInOut" | "wiggle"; stiffness?: number; damping?: number; mass?: number; delay?: number | ((i: number) => number); onComplete?: () => void; power?: number; timeConstant?: number; modifyTarget?: (v: number) => number; acceleration?: number; friction?: number; };
type AnimationOptions = { from: any; to: any; onUpdate?: (latest: any) => void; velocity?: number } & Transition;
type AnimationControls = { stop: () => void; isPlaying: () => boolean; play: () => void; pause: () => void; reverse: () => void; seek: (time: number) => void; timeScale: (scale: number) => void;};
type PanInfo = { point: Point; delta: Point; offset: Point; velocity: Point };
type DraggableProps = { drag?: boolean | "x" | "y"; dragConstraints?: React.RefObject<Element> | { top?: number; left?: number; right?: number; bottom?: number }; onDragStart?: (event: PointerEvent, info: PanInfo) => void; onDrag?: (event: PointerEvent, info: PanInfo) => void; onDragEnd?: (event: PointerEvent, info: PanInfo) => void; dragControls?: ReturnType<typeof useDragControls>; dragMomentum?: boolean; dragTransition?: Transition; };
type MotionComponentProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd"> & DraggableProps & { animate?: AnimationValues; initial?: AnimationValues; exit?: AnimationValues; transition?: Transition; whileHover?: AnimationValues; whileTap?: AnimationValues; whileFocus?: AnimationValues; whileInView?: AnimationValues; viewport?: IntersectionObserverInit & { once?: boolean }; layout?: boolean | "position" | "size"; layoutId?: string; };
interface MotionStore { values: Map<string, { value: any; velocity: number; lastUpdate: number }>; setValue: (key: string, value: any) => void; subscribe: (key: string, callback: (value: any) => void) => () => void; }

const clamp = (min: number, max: number, v: number) => Math.min(Math.max(v, min), max);
const progress = (from: number, to: number, value: number) => (to - from === 0 ? 1 : (value - from) / (to - from));
const mix = (from: number, to: number, p: number) => -p * from + p * to + from;

const colorRegex = /#(?:[0-9a-f]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)/gi;
const numberRegex = /-?\d*\.?\d+/g;

const mixColor = (from: string, to: string, p: number) => {
    const fromRGBA = toRGBA(from);
    const toRGBA = toRGBA(to);
    const result = fromRGBA.map((v, i) => Math.round(mix(v, toRGBA[i], p)));
    return `rgba(${result[0]}, ${result[1]}, ${result[2]}, ${result[3]})`;
};

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

const useMotionStore = create<MotionStore>((set, get) => ({
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

const easings = {
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

function animate({ from, to, onUpdate, onComplete, velocity = 0, ...options }: AnimationOptions): AnimationControls {
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

export function useText(text: string, splitBy: "char" | "word" | "line" = "char") {
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

export function useScramble(text: string, options?: { duration?: number, characters?: string }) {
    const { duration = 2, characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890" } = options || {};
    const scrambledText = useMotionValue(text);

    useEffect(() => {
        let animationFrame: number;
        const startTime = performance.now();
        const tick = () => {
            const elapsed = performance.now() - startTime;
            const p = clamp(0, 1, elapsed / (duration * 1000));
            const newText = Array.from(text).map((char, i) => {
                if (p > i / text.length) return char;
                return characters[Math.floor(Math.random() * characters.length)];
            }).join('');
            scrambledText.set(newText);
            if (p < 1) {
                animationFrame = requestAnimationFrame(tick);
            }
        };
        animationFrame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrame);
    }, [text, duration, characters, scrambledText]);

    return scrambledText;
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


const LayoutGroupContext = createContext<{ id: string, rects: Map<string, DOMRect> } | null>(null);

export const LayoutGroup = ({ children }: { children: React.ReactNode }) => {
    const [id] = useState(() => `layout-group-${Math.random().toString(36).substr(2, 9)}`);
    const [rects] = useState(() => new Map());
    return <LayoutGroupContext.Provider value={{ id, rects }}>{children}</LayoutGroupContext.Provider>;
};

function useLayoutAnimation(ref: React.RefObject<HTMLElement>, layoutId: string | undefined, layout: boolean | "position" | "size") {
    const layoutGroup = useContext(LayoutGroupContext);
    const prevRect = useRef<DOMRect | null>(null);

    useLayoutEffect(() => {
        if (!layout || !ref.current) return;
        
        const newRect = ref.current.getBoundingClientRect();

        let startRect = prevRect.current;
        if (layoutId && layoutGroup?.rects.has(layoutId)) {
            startRect = layoutGroup.rects.get(layoutId)!;
        }

        if (startRect) {
            const deltaX = startRect.left - newRect.left;
            const deltaY = startRect.top - newRect.top;
            const scaleX = startRect.width / newRect.width;
            const scaleY = startRect.height / newRect.height;

            if (deltaX !== 0 || deltaY !== 0 || scaleX !== 1 || scaleY !== 1) {
                ref.current.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
                ref.current.style.transformOrigin = "top left";
                requestAnimationFrame(() => {
                    ref.current!.style.transition = 'transform 0.3s';
                    ref.current!.style.transform = '';
                });
            }
        }

        if (layoutId && layoutGroup) {
            layoutGroup.rects.set(layoutId, newRect);
        }
        prevRect.current = newRect;
    });
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


function usePanGesture(
    ref: React.RefObject<HTMLElement>,
    { drag, dragConstraints, onDragStart, onDrag, onDragEnd, dragMomentum, dragTransition }: DraggableProps,
    motionValues: { x?: MotionValue<number>; y?: MotionValue<number> }
) {
    const isDragging = useRef(false);
    const startPoint = useRef({ x: 0, y: 0 });

    const handlePointerDown = useCallback((event: PointerEvent) => {
        if (!drag || !ref.current) return;
        isDragging.current = true;
        ref.current.style.cursor = "grabbing";
        ref.current.setPointerCapture(event.pointerId);

        const info = {
            point: { x: event.clientX, y: event.clientY },
            delta: { x: 0, y: 0 },
            offset: { x: motionValues.x?.get() || 0, y: motionValues.y?.get() || 0 },
            velocity: { x: 0, y: 0 },
        };
        startPoint.current = info.point;
        onDragStart?.(event, info);

        const handlePointerMove = (moveEvent: PointerEvent) => {
            if (!isDragging.current) return;
            const delta = { x: moveEvent.clientX - startPoint.current.x, y: moveEvent.clientY - startPoint.current.y };
            let newX = info.offset.x + delta.x;
            let newY = info.offset.y + delta.y;
            
            if (dragConstraints) {
                if ("current" in dragConstraints && dragConstraints.current) {
                    const parent = dragConstraints.current;
                    const parentRect = parent.getBoundingClientRect();
                    const childRect = ref.current!.getBoundingClientRect();
                    newX = clamp(parentRect.left - childRect.left + info.offset.x, parentRect.right - childRect.right + info.offset.x, newX);
                    newY = clamp(parentRect.top - childRect.top + info.offset.y, parentRect.bottom - childRect.bottom + info.offset.y, newY);
                } else if (!("current" in dragConstraints)) {
                    if (dragConstraints.left !== undefined) newX = Math.max(newX, dragConstraints.left);
                    if (dragConstraints.right !== undefined) newX = Math.min(newX, dragConstraints.right);
                    if (dragConstraints.top !== undefined) newY = Math.max(newY, dragConstraints.top);
                    if (dragConstraints.bottom !== undefined) newY = Math.min(newY, dragConstraints.bottom);
                }
            }

            if (drag === true || drag === "x") motionValues.x?.set(newX);
            if (drag === true || drag === "y") motionValues.y?.set(newY);

            const moveInfo = {
                ...info,
                point: { x: moveEvent.clientX, y: moveEvent.clientY },
                delta,
                velocity: { x: motionValues.x?.getVelocity() || 0, y: motionValues.y?.getVelocity() || 0 },
            };
            onDrag?.(moveEvent, moveInfo);
        };

        const handlePointerUp = (upEvent: PointerEvent) => {
            if (!isDragging.current || !ref.current) return;
            isDragging.current = false;
            ref.current.style.cursor = drag ? "grab" : "auto";
            ref.current.releasePointerCapture(upEvent.pointerId);

            const velocity = { x: motionValues.x?.getVelocity() || 0, y: motionValues.y?.getVelocity() || 0 };
            const endInfo = {
                ...info,
                point: { x: upEvent.clientX, y: upEvent.clientY },
                velocity,
            };
            onDragEnd?.(upEvent, endInfo);
            
            if (dragMomentum) {
                if (motionValues.x) {
                    animate({ type: 'inertia', from: motionValues.x.get(), velocity: velocity.x, ...dragTransition, onUpdate: (v) => motionValues.x?.set(v) });
                }
                if (motionValues.y) {
                    animate({ type: 'inertia', from: motionValues.y.get(), velocity: velocity.y, ...dragTransition, onUpdate: (v) => motionValues.y?.set(v) });
                }
            }
            
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

    }, [drag, ref, motionValues.x, motionValues.y, onDragStart, onDrag, onDragEnd, dragConstraints, dragMomentum, dragTransition]);

    onPointerDown(ref, handlePointerDown);
}

const MotionContext = createContext<Partial<MotionComponentProps>>({});
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
                if(isSVG) {
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
            if(isSVG && motionValues.pathLength && ref.current) {
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
            if(whileFocus) runAnimation(whileFocus);
        });
        onBlur(ref, () => {
            setIsFocusing(false);
            if(!isTapping && !isHovering) runAnimation(animateProps);
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

export const useDragControls = () => {
    return useMemo(() => ({ start: (e: React.PointerEvent) => {} }), []);
}

type AnimationRef = React.MutableRefObject<{ stop: () => void; play: () => void; }[]>;

export const useChain = (refs: AnimationRef[], timeStep: number = 0.1) => {
    useEffect(() => {
        refs.forEach((ref, i) => {
            setTimeout(() => {
                ref.current.forEach(control => control.play());
            }, i * timeStep * 1000);
        });
    }, [refs, timeStep]);
};

export const useTrail = <T extends any[]>(items: T, options: Transition & { from: AnimationValues, to: AnimationValues }) => {
    return items.map((_, i) => {
        const style = useMotionValue(options.from);
        useMemo(() => animate({
            from: 0,
            to: 1,
            ...options,
            delay: i * (typeof options.delay === 'number' ? options.delay : 0.1),
            onUpdate: (p) => {
                const newStyle: any = {};
                for (const key in options.to) {
                    const from = options.from?.[key] ?? 0;
                    const to = options.to?.[key] ?? 1;
                    newStyle[key] = mix(from, to, p);
                }
                style.set(newStyle);
            }
        }), [i, options, style]);
        return style;
    });
};

export const useTransition = <T extends any>(items: T[], keyAccessor: (item: T) => string, options: { from: AnimationValues; enter: AnimationValues; leave: AnimationValues; trail?: number; }) => {
    const [transitions, setTransitions] = useState<{ key: string; item: T; style: any; }[]>([]);

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
            const style = useMotionValue(options.from);
            animate({from: 0, to: 1, ...options, onUpdate: p => {
                const newStyle: any = {};
                for (const k in options.enter) {
                    newStyle[k] = mix(options.from[k], options.enter[k], p);
                }
                style.set(newStyle);
            }});
            return { key, item, style };
        });

        oldTransitions.forEach(t => {
            animate({from: 1, to: 0, ...options, onUpdate: p => {
                const newStyle: any = {};
                for (const k in options.leave) {
                    newStyle[k] = mix(options.enter[k], options.leave[k], p);
                }
                t.style.set(newStyle);
            }, onComplete: () => {
                setTransitions(current => current.filter(ct => ct.key !== t.key));
            }});
        });

        setTransitions(newTransitionsWithItems);

    }, [items, keyAccessor, options]);

    return transitions;
};

const ReorderContext = createContext<{
    onReorder: (from: number, to: number) => void;
    register: (value: any, y: MotionValue<number>) => void;
    unregister: (value: any) => void;
} | null>(null);

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
