import { useSyncExternalStore } from 'preact/compat';
import { not_globally_unique_generateId } from '~core/monitor/utils';
import { MAX_INTERACTION_BATCH, interactionStore } from './interaction-store';
import {
  FiberRenders,
  PerformanceEntryChannelEvent,
  TimeoutStage,
  listenForPerformanceEntryInteractions,
  listenForRenders,
  setupDetailedPointerTimingListener,
  setupPerformancePublisher,
} from './performance';
import {
  MAX_CHANNEL_SIZE,
  performanceEntryChannels,
} from './performance-store';
import { BoundedArray } from './performance-utils';
import { createStore } from '~web/utils/create-store';

let profileListeners: Array<(interaction: FinalInteraction) => void> = [];

type FinalInteraction = {
  detailedTiming: TimeoutStage;
  latency: number;
  completedAt: number;
};

export const listenForProfile = (
  listener: (interaction: FinalInteraction) => void,
) => {
  profileListeners.push(listener);

  return () => {
    profileListeners = profileListeners.filter(
      (existingListener) => existingListener !== listener,
    );
  };
};

export let interactionStatus:
  | { kind: 'started'; startedAt: number }
  | { kind: 'completed'; startedAt: number; endedAt: number }
  | { kind: 'no-interaction' } = {
  kind: 'no-interaction',
};

type NewInteractionStoreState = {
  /**
   * problem definition: we need to store bounds but how do we handle uninitialized bounds
   *
   * i guess what we said before, we just have one active bounds and that's all that matters chat
   */

  startAt: number;
  endAt: number;
};

export const interactionStatusStore: {
  state: NewInteractionStoreState | null;
  listeners: Array<(state: NewInteractionStoreState) => void>;
  addListener: (cb: (state: NewInteractionStoreState) => void) => () => void;
} = {
  state: null,
  addListener: (cb) => {
    interactionStatusStore.listeners.push(cb);
    return () => {
      interactionStatusStore.listeners =
        interactionStatusStore.listeners.filter((l) => l !== cb);
    };
  },
  listeners: [],
};

let accumulatedFiberRendersOverTask: null | FiberRenders = null;
type InteractionEvent = {
  kind: 'interaction';
  data: {
    startAt: number;
    endAt: number;
    meta: {
      detailedTiming: TimeoutStage;
      latency: number;
      kind: PerformanceEntryChannelEvent['kind'];
    };
  };
};

type LongRenderPipeline = {
  kind: 'long-render';
  data: {
    startAt: number;
    endAt: number;
    meta: {
      latency: number;
      fiberRenders: FiberRenders;
      fps: number;
    };
  };
};

export type SlowdownEvent = (InteractionEvent | LongRenderPipeline) & {
  id: string;
};

type ToolbarEventStoreState = {
  state: {
    events: BoundedArray<SlowdownEvent>;
  };
  actions: {
    addEvent: (event: SlowdownEvent) => void;
    addListener: (listener: (event: SlowdownEvent) => void) => () => void;
    clear: () => void;
  };
};

type DebugEvent = {
  kind: string;
  at: number;
  meta?: unknown;
};
export const debugEventStore = createStore<{
  state: {
    events: Array<DebugEvent>;
  };
  actions: {
    // biome-ignore lint/suspicious/noExplicitAny: debug only store
    addEvent: (event: any) => void;
    clear: () => void;
  };
}>()((set) => ({
  state: {
    events: [],
  },
  actions: {
    addEvent: (event: DebugEvent) => {
      set((store) => ({
        state: {
          events: [...store.state.events, event],
        },
      }));
    },
    clear: () => {
      set({
        state: {
          events: [],
        },
      });
    },
  },
}));

const EVENT_STORE_CAPACITY = 200;

export const toolbarEventStore = createStore<ToolbarEventStoreState>()(
  (set, get) => {
    const listeners = new Set<(event: SlowdownEvent) => void>();

    return {
      state: {
        events: new BoundedArray(EVENT_STORE_CAPACITY),
      },

      actions: {
        addEvent: (event: SlowdownEvent) => {
          listeners.forEach((listener) => listener(event));

          const events = [...get().state.events, event];
          const applyOverlapCheckToLongRenderEvent = (
            longRenderEvent: LongRenderPipeline & { id: string },
            onOverlap: (
              overlapsWith: InteractionEvent & { id: string },
            ) => void,
          ) => {
            const overlapsWith = events.find((event) => {
              if (event.kind === 'long-render') {
                return;
              }

              if (event.id === longRenderEvent.id) {
                return;
              }

              /**
               * |---x-----------x------ (interaction)
               * |x-----------x          (long-render)
               */

              if (
                longRenderEvent.data.startAt <= event.data.startAt &&
                longRenderEvent.data.endAt <= event.data.endAt &&
                longRenderEvent.data.endAt >= event.data.startAt
              ) {
                return true;
              }

              /**
             * |x-----------x---- (interaction)
             * |--x------------x  (long-render)
             *

             */

              if (
                event.data.startAt <= longRenderEvent.data.startAt &&
                event.data.endAt >= longRenderEvent.data.startAt
              ) {
                return true;
              }

              /**
               *
               * |--x-------------x    (interaction)
               * |x------------------x (long-render)
               *
               */

              if (
                longRenderEvent.data.startAt <= event.data.startAt &&
                longRenderEvent.data.endAt >= event.data.endAt
              ) {
                return true;
              }
            }) as undefined | (InteractionEvent & { id: string }); // invariant: because we early check the typechecker does not know it must be the case that when it finds something, it will be an interaction it overlaps with

            if (overlapsWith) {
              onOverlap(overlapsWith);
            }
          };

          const toRemove = new Set<string>();

          events.forEach((event) => {
            if (event.kind === 'interaction') return;
            applyOverlapCheckToLongRenderEvent(event, () => {
              toRemove.add(event.id);
            });
          });

          const withRemovedEvents = events.filter(
            (event) => !toRemove.has(event.id),
          );

          set(() => ({
            state: {
              events: BoundedArray.fromArray(
                withRemovedEvents,
                EVENT_STORE_CAPACITY,
              ),
            },
          }));
        },

        addListener: (listener: (event: SlowdownEvent) => void) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },

        clear: () => {
          set({
            state: {
              events: new BoundedArray(EVENT_STORE_CAPACITY),
            },
          });
        },
      },
    };
  },
);

export const useToolbarEventLog = () => {
  return useSyncExternalStore(
    toolbarEventStore.subscribe,
    toolbarEventStore.getState,
  );
};

let taskDirtyAt: null | number = null;
let taskDirtyOrigin: null | number = null;

let previousTrackCurrentMouseOverElementCallback:
  | ((e: MouseEvent) => void)
  | null = null;

let overToolbar: boolean | null;

const trackCurrentMouseOverToolbar = () => {
  const callback = (e: MouseEvent) => {
    overToolbar = e
      .composedPath()
      .map((path) => (path as Element).id)
      .filter(Boolean)
      .includes('react-scan-toolbar');
  };

  document.addEventListener('mouseover', callback);
  previousTrackCurrentMouseOverElementCallback = callback;

  return () => {
    if (previousTrackCurrentMouseOverElementCallback) {
      document.removeEventListener(
        'mouseover',
        previousTrackCurrentMouseOverElementCallback,
      );
    }
  };
};

// stops long tasks b/c backgrounded from being reported
export const startDirtyTaskTracking = () => {
  const onVisibilityChange = () => {
    taskDirtyAt = performance.now();
    taskDirtyOrigin = performance.timeOrigin;
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
};

export const HIGH_SEVERITY_FPS_DROP_TIME = 150;

let framesDrawnInTheLastSecond: Array<number> = [];

export function startLongPipelineTracking() {
  let rafHandle: number;
  let timeoutHandle: ReturnType<typeof setTimeout>;

  function measure() {
    let unSub: (() => void) | null = null;
    accumulatedFiberRendersOverTask = null;
    accumulatedFiberRendersOverTask = {};
    unSub = listenForRenders(accumulatedFiberRendersOverTask);
    const startOrigin = performance.timeOrigin;
    const startTime = performance.now();
    rafHandle = requestAnimationFrame(() => {
      // very low overhead, on the order of dozens of microseconds to run
      timeoutHandle = setTimeout(() => {
        const endNow = performance.now();
        const duration = endNow - startTime;
        const endOrigin = performance.timeOrigin;
        framesDrawnInTheLastSecond.push(endNow + endOrigin);

        const framesInTheLastSecond = framesDrawnInTheLastSecond.filter(
          (frameAt) => endNow + endOrigin - frameAt <= 1000,
        );

        const fps = framesInTheLastSecond.length;
        framesDrawnInTheLastSecond = framesInTheLastSecond;

        const taskConsideredDirty =
          taskDirtyAt !== null && taskDirtyOrigin !== null
            ? endNow + endOrigin - (taskDirtyOrigin + taskDirtyAt) < 100
            : null;
        // not useful to report slowdowns caused by things like outlines (can get expensive not fully optimized)
        const wasTaskInfluencedByToolbar = overToolbar !== null && overToolbar;

        if (
          duration > HIGH_SEVERITY_FPS_DROP_TIME &&
          !taskConsideredDirty &&
          document.visibilityState === 'visible' &&
          !wasTaskInfluencedByToolbar
        ) {
          const endAt = endOrigin + endNow;
          const startAt = startTime + startOrigin;

          toolbarEventStore.getState().actions.addEvent({
            kind: 'long-render',
            id: not_globally_unique_generateId(),
            data: {
              endAt: endAt,
              startAt: startAt,
              meta: {
                // biome-ignore lint/style/noNonNullAssertion: invariant: this will exist by this point
                fiberRenders: accumulatedFiberRendersOverTask!,
                latency: duration,
                fps,
              },
            },
          });
        }

        taskDirtyAt = null;
        taskDirtyOrigin = null;

        unSub?.();
        measure();
      }, 0);
    });
    return unSub;
  }

  const measureUnSub = measure();

  return () => {
    measureUnSub();
    cancelAnimationFrame(rafHandle);
    clearTimeout(timeoutHandle);
  };
}
export const startTimingTracking = () => {
  const unSubPerformance = setupPerformancePublisher();
  const unSubMouseOver = trackCurrentMouseOverToolbar();
  const unSubDirtyTaskTracking = startDirtyTaskTracking();
  const unSubLongPipelineTracking = startLongPipelineTracking();

  const onComplete = async (
    _: string,
    finalInteraction: FinalInteraction,
    event: PerformanceEntryChannelEvent,
  ) => {
    toolbarEventStore.getState().actions.addEvent({
      kind: 'interaction',
      id: not_globally_unique_generateId(),
      data: {
        startAt: finalInteraction.detailedTiming.blockingTimeStart,
        endAt: performance.now() + performance.timeOrigin,
        meta: { ...finalInteraction, kind: event.kind }, // TODO, will need interaction specific metadata here
      },
    });

    const existingCompletedInteractions =
      performanceEntryChannels.getChannelState('recording');

    finalInteraction.detailedTiming.stopListeningForRenders();

    if (existingCompletedInteractions.length) {
      // then performance entry and our detailed timing handlers are out of sync, we disregard that entry
      // it may be possible the performance entry returned before detailed timing. If that's the case we should update
      // assumptions and deal with mapping the entry back to the detailed timing here
      performanceEntryChannels.updateChannelState(
        'recording',
        () => new BoundedArray(MAX_CHANNEL_SIZE),
      );
    }
  };
  const unSubDetailedPointerTiming = setupDetailedPointerTimingListener(
    'pointer',
    {
      onComplete,
    },
  );
  const unSubDetailedKeyboardTiming = setupDetailedPointerTimingListener(
    'keyboard',
    {
      onComplete,
    },
  );

  const unSubInteractions = listenForPerformanceEntryInteractions(
    (completedInteraction) => {
      interactionStore.setState(
        BoundedArray.fromArray(
          interactionStore.getCurrentState().concat(completedInteraction),
          MAX_INTERACTION_BATCH,
        ),
      );
    },
  );

  return () => {
    unSubMouseOver();
    unSubDirtyTaskTracking();
    unSubLongPipelineTracking();
    unSubPerformance();
    unSubDetailedPointerTiming();
    unSubInteractions();
    unSubDetailedKeyboardTiming();
  };
};
