import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { create } from "zustand";
import { onPointerDown, onPointerUp, onPointerMove, onMouseEnter, onMouseLeave } from "@/lib/interaction";

type MotionValue<T = any> = {
    id: string;
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => () => void;
    getVelocity: () => number;
};
type EasingFunction = (v: number) => number;
type AnimationValues = { [key: string]: any };
type Point = { x: number; y: number };
type Transition = { type?: "spring" | "tween"; duration?: number; ease?: EasingFunction | EasingFunction[]; stiffness?: number; damping?: number; mass?: number; delay?: number; onComplete?: () => void; };
type AnimationOptions = { from: number; to: number; onUpdate?: (latest: number) => void; } & Transition;
type AnimationControls = { stop: () => void; isPlaying: () => boolean };
type PanInfo = { point: Point; delta: Point; offset: Point; velocity: Point };
type DraggableProps = { drag?: boolean | "x" | "y"; dragConstraints?: React.RefObject<Element> | { top?: number; left?: number; right?: number; bottom?: number }; onDragStart?: (event: PointerEvent, info: PanInfo) => void; onDrag?: (event: PointerEvent, info: PanInfo) => void; onDragEnd?: (event: PointerEvent, info: PanInfo) => void; dragControls?: ReturnType<typeof useDragControls>; };
type MotionComponentProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd"> & DraggableProps & { animate?: AnimationValues; initial?: AnimationValues; exit?: AnimationValues; transition?: Transition; whileHover?: AnimationValues; whileTap?: AnimationValues; whileInView?: AnimationValues; viewport?: IntersectionObserverInit & { once?: boolean }; layout?: boolean | "position" | "size"; };
interface MotionStore { values: Map<string, { value: any; velocity: number; lastUpdate: number }>; setValue: (key: string, value: any) => void; subscribe: (key: string, callback: (value: any) => void) => () => void; }

const clamp = (min: number, max: number, v: number) => Math.min(Math.max(v, min), max);
const progress = (from: number, to: number, value: number) => (to - from === 0 ? 1 : (value - from) / (to - from));
const mix = (from: number, to: number, p: number) => -p * from + p * to + from;

const useMotionStore = create<MotionStore>((set, get) => ({
    values: new Map(),
    setValue: (key, value) => {
        const now = performance.now();
        const state = get();
        const prev = state.values.get(key) || { value: 0, velocity: 0, lastUpdate: now };
        const timeDelta = Math.max(1, now - prev.lastUpdate);
        const newVelocity = (value - prev.value) / timeDelta * 1000;
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

const easings = {
    linear: (v: number) => v,
    easeIn: (p: number) => p * p,
    easeOut: (p: number) => 1 - (1 - p) * (1 - p),
    easeInOut: (p: number) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
};

function animate({ from, to, onUpdate, onComplete, ...options }: AnimationOptions): AnimationControls {
    let isActive = true;
    const { duration = 0.3, ease = easings.easeInOut, type = "tween", stiffness = 100, damping = 10, mass = 1 } = options;
    let animationFrame: number;

    const stop = () => {
        isActive = false;
        cancelAnimationFrame(animationFrame);
    };

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
                stop();
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
            const easedProgress = Array.isArray(ease) ? ease[0](p) : ease(p);
            onUpdate?.(mix(from, to, easedProgress));
            if (p < 1) {
                animationFrame = requestAnimationFrame(tick);
            } else {
                onComplete?.();
                stop();
            }
        };
        animationFrame = requestAnimationFrame(tick);
    }

    return { stop, isPlaying: () => isActive };
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

function usePanGesture(
    ref: React.RefObject<HTMLElement>,
    { drag, dragConstraints, onDragStart, onDrag, onDragEnd }: DraggableProps,
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
            const newX = info.offset.x + delta.x;
            const newY = info.offset.y + delta.y;
            
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

            const endInfo = {
                ...info,
                point: { x: upEvent.clientX, y: upEvent.clientY },
                velocity: { x: motionValues.x?.getVelocity() || 0, y: motionValues.y?.getVelocity() || 0 },
            };
            onDragEnd?.(upEvent, endInfo);
            
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

    }, [drag, ref, motionValues.x, motionValues.y, onDragStart, onDrag, onDragEnd]);

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

    }, [children]);
    
    return (
        <PresenceContext.Provider value={{ isPresent: true }}>
            {presentChildren.map(child => {
                const isExiting = exiting.has(child.key!);
                return (
                    <PresenceContext.Provider key={child.key} value={{ isPresent: !isExiting, onExitComplete: () => {} }}>
                        {React.cloneElement(child, { _isExiting: isExiting })}
                    </PresenceContext.Provider>
                );
            })}
        </PresenceContext.Provider>
    );
}

const motionComponent = <P extends object, R>(Component: React.ForwardRefExoticComponent<P & React.RefAttributes<R>>) => {
    return React.forwardRef<R, P & MotionComponentProps & { _isExiting?: boolean }>((props, externalRef) => {
        const config = useContext(MotionContext);
        const presence = useContext(PresenceContext);
        const { animate: animateProps, initial, exit, transition, whileHover, whileTap, drag, dragConstraints, onDragStart, onDrag, onDragEnd, layout, style, _isExiting, ...rest } = { ...config, ...props };
        
        const internalRef = useRef<HTMLElement>(null);
        const ref = (externalRef || internalRef) as React.RefObject<HTMLElement>;
        
        const reducedMotion = useReducedMotion();
        const isMounted = useRef(false);

        const motionValues = useMemo(() => {
            const values: { [key: string]: MotionValue<any> } = {};
            const allKeys = { ...style, ...initial, ...animateProps, ...whileHover, ...whileTap, ...exit };
            for (const key in allKeys) {
                if (key === "x" || key === "y" || key === "scale" || key === "rotate" || key === "opacity") {
                    const initialValue = (style as any)?.[key] ?? initial?.[key] ?? 0;
                    values[key] = useMotionValue(initialValue);
                }
            }
            return values;
        }, []);

        const runAnimation = useCallback((values: AnimationValues | undefined, onComplete?: () => void) => {
            if (!values || reducedMotion) {
                onComplete?.();
                return;
            }
            const animations = Object.keys(values).map(key => new Promise(resolve => {
                const mv = motionValues[key];
                if (mv) {
                    animate({
                        from: mv.get(),
                        to: values[key],
                        ...transition,
                        onUpdate: latest => mv.set(latest),
                        onComplete: resolve
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
                if (key === "x" || key === "y" || key === "scale" || key === "rotate") {
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
        }, [motionValues]);

        useEffect(() => {
            if (!presence && !isMounted.current) {
                runAnimation(initial);
            } else if (presence?.isPresent && isMounted.current) {
                runAnimation(animateProps);
            } else if (_isExiting) {
                runAnimation(exit, presence?.onExitComplete?.(props.key!));
            }
            if (!isMounted.current) isMounted.current = true;
        }, [presence?.isPresent, _isExiting, animateProps]);

        const [isHovering, setIsHovering] = useState(false);
        const [isTapping, setIsTapping] = useState(false);

        onMouseEnter(ref, () => {
            setIsHovering(true);
            if (whileHover) runAnimation(whileHover);
        });
        onMouseLeave(ref, () => {
            setIsHovering(false);
            if (!isTapping) runAnimation(animateProps);
        });
        onPointerDown(ref, () => {
            setIsTapping(true);
            if (whileTap) runAnimation(whileTap);
        });
        onPointerUp(ref, () => {
            setIsTapping(false);
            if (!isHovering) runAnimation(animateProps);
            else if (whileHover) runAnimation(whileHover);
        });

        usePanGesture(ref, { drag, dragConstraints, onDragStart, onDrag, onDragEnd }, motionValues);

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
    [Tag in keyof JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
        MotionComponentProps & React.RefAttributes<JSX.IntrinsicElements[Tag]>
    >;
};

const factory = new Proxy(
    {},
    {
        get: (target, prop: string) => {
            return motionComponent(React.forwardRef((props, ref) => React.createElement(prop, { ...props, ref })));
        },
    }
);

export const motion = factory as MotionFactory;
export const useReducedMotion = () => {
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
export const useDragControls = () => {
    return useMemo(() => ({ start: (e: React.PointerEvent) => {} }), []);
}
