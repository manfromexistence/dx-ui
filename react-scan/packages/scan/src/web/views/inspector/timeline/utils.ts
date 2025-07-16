import {
  ClassComponentTag,
  type ContextDependency,
  type Fiber,
  ForwardRefTag,
  FunctionComponentTag,
  MemoComponentTag,
  type MemoizedState,
  SimpleMemoComponentTag,
} from 'bippy';
import { isEqual } from '~core/utils';
import { getChangedPropsDetailed, isPromise } from '../utils';

interface ChangeTrackingInfo {
  count: number;
  currentValue: unknown;
  previousValue: unknown;
  lastUpdated: number;
}

type ChangeKey = string | number;

const propsTracker = new Map<string, ChangeTrackingInfo>();
const stateTracker = new Map<ChangeKey, ChangeTrackingInfo>();
const contextTracker = new Map<string, ChangeTrackingInfo>();
let lastComponentType: unknown = null;

const STATE_NAME_REGEX = /\[(?<name>\w+),\s*set\w+\]/g;
const PROPS_ORDER_REGEX = /\(\s*{\s*(?<props>[^}]+)\s*}\s*\)/;

export const getStateNames = (fiber: Fiber): Array<string> => {
  const componentSource = fiber.type?.toString?.() || '';
  return componentSource
    ? Array.from(
        componentSource.matchAll(STATE_NAME_REGEX),
        (m: RegExpMatchArray) => m.groups?.name ?? '',
      )
    : [];
};

export const resetTracking = () => {
  propsTracker.clear();
  stateTracker.clear();
  contextTracker.clear();
  lastComponentType = null;
};

export const isInitialComponentUpdate = (fiber: Fiber): boolean => {
  const isNewComponent = fiber.type !== lastComponentType;
  lastComponentType = fiber.type;
  return isNewComponent;
};

export const trackChange = (
  tracker: Map<ChangeKey, ChangeTrackingInfo>,
  key: ChangeKey,
  currentValue: unknown,
  previousValue: unknown,
): { hasChanged: boolean; count: number } => {
  const existing = tracker.get(key);
  const isInitialValue = tracker === propsTracker || tracker === contextTracker;
  const hasChanged = !isEqual(currentValue, previousValue);

  if (!existing) {
    // For props and context, start with count 1 if there's a change
    tracker.set(key, {
      count: hasChanged && isInitialValue ? 1 : 0,
      currentValue,
      previousValue,
      lastUpdated: Date.now(),
    });

    return {
      hasChanged,
      count: hasChanged && isInitialValue ? 1 : isInitialValue ? 0 : 1,
    };
  }

  if (!isEqual(existing.currentValue, currentValue)) {
    const newCount = existing.count + 1;
    tracker.set(key, {
      count: newCount,
      currentValue,
      previousValue: existing.currentValue,
      lastUpdated: Date.now(),
    });
    return { hasChanged: true, count: newCount };
  }

  return { hasChanged: false, count: existing.count };
};

export { propsTracker, stateTracker, contextTracker };

export interface SectionData {
  current: Array<{ name: string | number; value: unknown }>;
  changes: Set<string | number>;
  changesCounts: Map<string | number, number>;
}

export interface InspectorData {
  fiberProps: SectionData;
  fiberState: SectionData;
  fiberContext: SectionData;
}

export const getStateFromFiber = (
  fiber: Fiber,
): Record<string | number, unknown> => {
  if (!fiber) return {};

  if (
    fiber.tag === FunctionComponentTag ||
    fiber.tag === ForwardRefTag ||
    fiber.tag === SimpleMemoComponentTag ||
    fiber.tag === MemoComponentTag
  ) {
    let memoizedState: MemoizedState | null = fiber.memoizedState;
    const state: Record<number, unknown> = {};
    let index = 0;

    while (memoizedState) {
      if (memoizedState.queue && memoizedState.memoizedState !== undefined) {
        state[index] = memoizedState.memoizedState;
      }
      memoizedState = memoizedState.next;
      index++;
    }

    return state;
  }

  if (fiber.tag === ClassComponentTag) {
    return fiber.memoizedState || {};
  }

  return {};
};

/**
 * Used to preserve the order of the fiber's props as represented in source code
 */
export const getPropsOrder = (fiber: Fiber): Array<string> => {
  const componentSource = fiber.type?.toString?.() || '';
  const match = componentSource.match(PROPS_ORDER_REGEX);
  if (!match?.groups?.props) return [];

  return match.groups.props
    .split(',')
    .map((prop: string) => prop.trim().split(':')[0].split('=')[0].trim())
    .filter(Boolean);
};

export interface InspectorDataResult {
  data: InspectorData;
  shouldUpdate: boolean;
}

interface BaseChange {
  name: string | number;
  value: unknown;
  prevValue: unknown;
}

interface PropChange extends BaseChange {
  name: string;
}

interface StateChange extends BaseChange {
  name: string | number;
}

interface ContextChange extends BaseChange {
  name: string;
  contextType: unknown;
}

interface CollectorResult<T extends BaseChange = BaseChange> {
  current: Record<string | number, unknown>;
  prev: Record<string | number, unknown>;
  changes: Array<T>;
}

export const collectPropsChanges = (
  fiber: Fiber,
): CollectorResult<PropChange> => {
  const currentProps = fiber.memoizedProps || {};
  const prevProps = fiber.alternate?.memoizedProps || {};

  const current: Record<string, unknown> = {};
  const prev: Record<string, unknown> = {};

  const allProps = Object.keys(currentProps);
  for (const key of allProps) {
    if (key in currentProps) {
      current[key] = currentProps[key];
      prev[key] = prevProps[key];
    }
  }

  const changes = getChangedPropsDetailed(fiber).map((change) => ({
    name: change.name,
    value: change.value,
    prevValue: change.prevValue,
  }));

  return { current, prev, changes };
};

export const collectStateChanges = (
  fiber: Fiber,
): CollectorResult<StateChange> => {
  const current = getStateFromFiber(fiber);
  const prev = fiber.alternate ? getStateFromFiber(fiber.alternate) : {};
  const changes: Array<StateChange> = [];

  for (const [index, value] of Object.entries(current)) {
    const stateKey = fiber.tag === ClassComponentTag ? index : Number(index);
    if (fiber.alternate && !isEqual(prev[index], value)) {
      changes.push({
        name: stateKey,
        value,
        prevValue: prev[index],
      });
    }
  }

  return { current, prev, changes };
};

export const collectContextChanges = (
  fiber: Fiber,
): CollectorResult<ContextChange> => {
  const currentContexts = getAllFiberContexts(fiber);
  const prevContexts = fiber.alternate
    ? getAllFiberContexts(fiber.alternate)
    : new Map();

  const current: Record<string, unknown> = {};
  const prev: Record<string, unknown> = {};
  const changes: Array<ContextChange> = [];

  const seenContexts = new Set<unknown>();
  for (const [contextType, ctx] of currentContexts) {
    const name = ctx.displayName;
    const contextKey = contextType;

    if (seenContexts.has(contextKey)) continue;
    seenContexts.add(contextKey);

    current[name] = ctx.value;

    const prevCtx = prevContexts.get(contextType);
    if (prevCtx) {
      prev[name] = prevCtx.value;
      if (!isEqual(prevCtx.value, ctx.value)) {
        changes.push({
          name,
          value: ctx.value,
          prevValue: prevCtx.value,
          contextType,
        });
      }
    }
  }

  return { current, prev, changes };
};

export const collectInspectorData = (fiber: Fiber): InspectorDataResult => {
  const emptySection = (): SectionData => ({
    current: [],
    changes: new Set<string | number>(),
    changesCounts: new Map<string | number, number>(),
  });

  if (!fiber) {
    return {
      data: {
        fiberProps: emptySection(),
        fiberState: emptySection(),
        fiberContext: emptySection(),
      },
      shouldUpdate: false,
    };
  }

  let hasNewChanges = false;
  const isInitialUpdate = isInitialComponentUpdate(fiber);

  const propsData = emptySection();
  if (fiber.memoizedProps) {
    const { current, changes } = collectPropsChanges(fiber);

    for (const [key, value] of Object.entries(current)) {
      propsData.current.push({
        name: key,
        value: isPromise(value)
          ? { type: 'promise', displayValue: 'Promise' }
          : value,
      });
    }

    for (const change of changes) {
      const { hasChanged, count } = trackChange(
        propsTracker,
        change.name,
        change.value,
        change.prevValue,
      );

      if (hasChanged) {
        hasNewChanges = true;
        propsData.changes.add(change.name);
        propsData.changesCounts.set(change.name, count);
      }
    }
  }

  const stateData = emptySection();
  const { current: stateCurrent, changes: stateChanges } =
    collectStateChanges(fiber);

  for (const [index, value] of Object.entries(stateCurrent)) {
    const stateKey = fiber.tag === ClassComponentTag ? index : Number(index);
    stateData.current.push({ name: stateKey, value });
  }

  for (const change of stateChanges) {
    const { hasChanged, count } = trackChange(
      stateTracker,
      change.name,
      change.value,
      change.prevValue,
    );

    if (hasChanged) {
      hasNewChanges = true;
      stateData.changes.add(change.name);
      stateData.changesCounts.set(change.name, count);
    }
  }

  const contextData = emptySection();
  const { current: contextCurrent, changes: contextChanges } =
    collectContextChanges(fiber);

  for (const [name, value] of Object.entries(contextCurrent)) {
    contextData.current.push({ name, value });
  }

  if (!isInitialUpdate) {
    for (const change of contextChanges) {
      const { hasChanged, count } = trackChange(
        contextTracker,
        change.name,
        change.value,
        change.prevValue,
      );

      if (hasChanged) {
        hasNewChanges = true;
        contextData.changes.add(change.name);
        contextData.changesCounts.set(change.name, count);
      }
    }
  }

  if (!hasNewChanges && !isInitialUpdate) {
    propsData.changes.clear();
    stateData.changes.clear();
    contextData.changes.clear();
  }

  return {
    data: {
      fiberProps: propsData,
      fiberState: stateData,
      fiberContext: contextData,
    },
    shouldUpdate: hasNewChanges || isInitialUpdate,
  };
};

interface ContextInfo {
  value: unknown;
  displayName: string;
  contextType: unknown;
}
// hm we potentially want to revalidate this if a fiber has new context's, i'm not sure how we can do that reactively
// i suppose we can do one traversal on render (or during the existing traversal) that checks if any new context providers were mounted
// and when that happens we revalidate this cache

// i suppose a case this breaks is if a fiber changes ancestors through a key but doesn't remount
// then it would have new parents... and that new parent may have new context
// may be a fine trade off
// the motivation is this fiber traversal on every rendering fiber is extremely expensive
const fiberContextsCache = new WeakMap<Fiber, Map<unknown, ContextInfo>>();

export const getAllFiberContexts = (
  fiber: Fiber,
): Map<unknown, ContextInfo> => {
  if (!fiber) {
    return new Map<unknown, ContextInfo>();
  }

  // todo validate this works

  const cachedContexts = fiberContextsCache.get(fiber);
  if (cachedContexts) {
    return cachedContexts;
  }

  const contexts = new Map<unknown, ContextInfo>();
  let currentFiber: Fiber | null = fiber;

  while (currentFiber) {
    const dependencies = currentFiber.dependencies;

    if (dependencies?.firstContext) {
      let contextItem: ContextDependency<unknown> | null =
        dependencies.firstContext;

      while (contextItem) {
        const memoizedValue = contextItem.memoizedValue;
        const displayName = contextItem.context?.displayName;

        if (!contexts.has(memoizedValue)) {
          contexts.set(contextItem.context, {
            value: memoizedValue,
            displayName: displayName ?? 'UnnamedContext',
            contextType: null,
          });
        }

        if (contextItem === contextItem.next) {
          break;
        }

        contextItem = contextItem.next;
      }
    }

    currentFiber = currentFiber.return;
  }

  // Cache the result for this fiber
  fiberContextsCache.set(fiber, contexts);

  return contexts;
};

export const collectInspectorDataWithoutCounts = (fiber: Fiber) => {
  const emptySection = (): SectionData => ({
    current: [],
    changes: new Set<string | number>(),
    changesCounts: new Map<string | number, number>(),
  });

  if (!fiber) {
    return {
      fiberProps: emptySection(),
      fiberState: emptySection(),
      fiberContext: emptySection(),
    };
  }

  // let hasNewChanges = false;

  const propsData = emptySection();
  if (fiber.memoizedProps) {
    const { current, changes } = collectPropsChanges(fiber);

    for (const [key, value] of Object.entries(current)) {
      propsData.current.push({
        name: key,
        value: isPromise(value)
          ? { type: 'promise', displayValue: 'Promise' }
          : value,
      });
    }

    for (const change of changes) {
      // hasNewChanges = true;
      propsData.changes.add(change.name);
      propsData.changesCounts.set(change.name, 1);
    }
  }

  const stateData = emptySection();
  if (fiber.memoizedState) {
    const { current, changes } = collectStateChanges(fiber);

    for (const [key, value] of Object.entries(current)) {
      stateData.current.push({
        name: key,
        value: isPromise(value)
          ? { type: 'promise', displayValue: 'Promise' }
          : value,
      });
    }

    for (const change of changes) {
      // hasNewChanges = true;
      stateData.changes.add(change.name);
      stateData.changesCounts.set(change.name, 1);
    }
  }

  const contextData = emptySection();
  const { current, changes } = collectContextChanges(fiber);

  for (const [key, value] of Object.entries(current)) {
    contextData.current.push({
      name: key,
      value: isPromise(value)
        ? { type: 'promise', displayValue: 'Promise' }
        : value,
    });
  }

  for (const change of changes) {
    // hasNewChanges = true;
    contextData.changes.add(change.name);
    contextData.changesCounts.set(change.name, 1);
  }
  // todo: is isInitialUpdate correct? Is this necessary:
  // if (!hasNewChanges && !isInitialUpdate) {
  //   propsData.changes.clear();
  //   stateData.changes.clear();
  //   contextData.changes.clear();
  // }

  return {
    // data: {
    fiberProps: propsData,
    fiberState: stateData,
    fiberContext: contextData,
    // },
  };
};
