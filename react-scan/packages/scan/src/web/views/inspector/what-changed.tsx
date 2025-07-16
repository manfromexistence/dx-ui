import { type ReactNode, memo } from 'preact/compat';
import {
  type Dispatch,
  type StateUpdater,
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';
import { CopyToClipboard } from '~web/components/copy-to-clipboard';
import { Icon } from '~web/components/icon';
import { cn, throttle } from '~web/utils/helpers';
import { DiffValueView } from './diff-value';
import { timelineState } from './states';
import {
  AggregatedChanges,
  formatFunctionPreview,
  formatPath,
  getObjectDiff,
  isPromise,
} from './utils';
import {
  calculateTotalChanges,
  useInspectedFiberChangeStore,
} from './whats-changed/use-change-store';
import { getDisplayName, getType } from 'bippy';
import { Store } from '~core/index';

export type Setter<T> = Dispatch<StateUpdater<T>>;

const safeGetValue = (value: unknown): { value: unknown; error?: string } => {
  if (value === null || value === undefined) return { value };
  if (typeof value === 'function') return { value };
  if (typeof value !== 'object') return { value };

  if (isPromise(value)) {
    return { value: 'Promise' };
  }

  try {
    const proto = Object.getPrototypeOf(value);
    if (proto === Promise.prototype || proto?.constructor?.name === 'Promise') {
      return { value: 'Promise' };
    }

    return { value };
  } catch {
    return { value: null, error: 'Error accessing value' };
  }
};

export const WhatChanged = /* @__PURE__ */ memo(() => {
  const [isExpanded, setIsExpanded] = useState(true);
  const aggregatedChanges = useInspectedFiberChangeStore();

  const [hasInitialized, setHasInitialized] = useState(false);
  const hasAnyChanges = calculateTotalChanges(aggregatedChanges) > 0;
  useEffect(() => {
    if (!hasInitialized && hasAnyChanges) {
      const timer = setTimeout(() => {
        setHasInitialized(true);
        requestAnimationFrame(() => {
          setIsExpanded(true);
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hasInitialized, hasAnyChanges]);

  const initializedContextChanges = new Map(
    Array.from(aggregatedChanges.contextChanges.entries())
      .filter(([, value]) => value.kind === 'initialized')
      .map(([key, value]) => [
        key,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        value.kind === 'partially-initialized' ? null! : value.changes,
      ]),
  );

  const fiber =
    Store.inspectState.value.kind === 'focused'
      ? Store.inspectState.value.fiber
      : null;

  if (!fiber) {
    // invariant
    return;
  }
  return (
    <>
      <WhatsChangedHeader />

      <div className="overflow-hidden h-full flex flex-col gap-y-2">
        <div className="flex flex-col gap-2 px-3 pt-2">
          <span className="text-sm font-medium text-[#888]">
            Why did{' '}
            <span className="text-[#A855F7]">{getDisplayName(fiber)}</span>{' '}
            render?
          </span>
          {!hasAnyChanges && (
            <div className="text-sm text-[#737373] bg-[#1E1E1E] rounded-md p-4 flex flex-col gap-4">
              <div>No changes detected since selecting</div>
              <div>
                The props, state, and context changes within your component will
                be reported here
              </div>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex flex-col gap-y-2 pl-3 relative overflow-y-auto h-full',
          )}
        >
          <Section
            changes={aggregatedChanges.propsChanges}
            title="Changed Props"
            isExpanded={isExpanded}
          />
          <Section
            renderName={(name) =>
              renderStateName(
                name,
                getDisplayName(getType(fiber)) ?? 'Unknown Component',
              )
            }
            changes={aggregatedChanges.stateChanges}
            title="Changed State"
            isExpanded={isExpanded}
          />
          <Section
            changes={initializedContextChanges}
            title="Changed Context"
            isExpanded={isExpanded}
          />
        </div>
      </div>
    </>
  );
});

const renderStateName = (key: string, componentName: string) => {
  if (Number.isNaN(Number(key))) {
    return key;
  }

  const n = Number.parseInt(key);
  const getOrdinalSuffix = (num: number) => {
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th';
    }
    switch (lastDigit) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  return (
    <span className="truncate">
      <span className="text-white">
        {n}
        {getOrdinalSuffix(n)} hook{' '}
      </span>
      <span style={{ color: '#666' }}>
        called in <i className="text-[#A855F7] truncate">{componentName}</i>
      </span>
    </span>
  );
};

const WhatsChangedHeader = memo(() => {
  const refProps = useRef<HTMLDivElement>(null);
  const refState = useRef<HTMLDivElement>(null);
  const refContext = useRef<HTMLDivElement>(null);

  const refStats = useRef<{
    isPropsChanged: boolean;
    isStateChanged: boolean;
    isContextChanged: boolean;
  }>({
    isPropsChanged: false,
    isStateChanged: false,
    isContextChanged: false,
  });

  useEffect(() => {
    const flash = throttle(() => {
      const flashElements = [];
      if (refProps.current?.dataset.flash === 'true') {
        flashElements.push(refProps.current);
      }
      if (refState.current?.dataset.flash === 'true') {
        flashElements.push(refState.current);
      }
      if (refContext.current?.dataset.flash === 'true') {
        flashElements.push(refContext.current);
      }

      for (const element of flashElements) {
        element.classList.remove('count-flash-white');
        void element.offsetWidth;
        element.classList.add('count-flash-white');
      }
    }, 400);

    const unsubscribe = timelineState.subscribe((state) => {
      if (!refProps.current || !refState.current || !refContext.current) {
        return;
      }

      const { currentIndex, updates } = state;
      const currentUpdate = updates[currentIndex];

      if (!currentUpdate || currentIndex === 0) {
        return;
      }

      flash();

      refStats.current = {
        isPropsChanged: (currentUpdate.props?.changes?.size ?? 0) > 0,
        isStateChanged: (currentUpdate.state?.changes?.size ?? 0) > 0,
        isContextChanged: (currentUpdate.context?.changes?.size ?? 0) > 0,
      };

      if (refProps.current.dataset.flash !== 'true') {
        refProps.current.dataset.flash =
          refStats.current.isPropsChanged.toString();
      }
      if (refState.current.dataset.flash !== 'true') {
        refState.current.dataset.flash =
          refStats.current.isStateChanged.toString();
      }
      if (refContext.current.dataset.flash !== 'true') {
        refContext.current.dataset.flash =
          refStats.current.isContextChanged.toString();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <button
      type="button"
      className={cn(
        'react-section-header',
        'overflow-hidden',
        'max-h-0',
        'transition-[max-height]',
      )}
    >
      <div className={cn('flex-1 react-scan-expandable')}>
        <div className="overflow-hidden">
          <div className="flex items-center whitespace-nowrap">
            <div className="flex items-center gap-x-2">What changed?</div>

            <div
              className={cn(
                'ml-auto',
                'change-scope',
                'transition-opacity duration-300 delay-150',
              )}
            >
              <div ref={refProps}>props</div>
              <div ref={refState}>state</div>
              <div ref={refContext}>context</div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
});

interface SectionProps {
  title: string;
  isExpanded: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  changes: Map<any, AggregatedChanges>;
  renderName?: (name: string) => ReactNode;
}
const identity = <T,>(x: T) => x;
const Section = /* @__PURE__ */ memo(
  ({ title, changes, renderName = identity }: SectionProps) => {
    const [expandedFns, setExpandedFns] = useState(new Set<string>());
    const [expandedEntries, setExpandedEntries] = useState(new Set<string>());

    const entries = Array.from(changes.entries());

    if (changes.size === 0) {
      return null;
    }
    return (
      <div>
        <div className="text-xs text-[#888] mb-1.5">{title}</div>
        <div className="flex flex-col gap-2">
          {entries.map(([entryKey, change]) => {
            const isEntryExpanded = expandedEntries.has(String(entryKey));
            const { value: prevValue, error: prevError } = safeGetValue(
              change.previousValue,
            );
            const { value: currValue, error: currError } = safeGetValue(
              change.currentValue,
            );

            const diff = getObjectDiff(prevValue, currValue);

            return (
              <div key={entryKey}>
                <button
                  onClick={() => {
                    setExpandedEntries((prev) => {
                      const next = new Set(prev);
                      if (next.has(String(entryKey))) {
                        next.delete(String(entryKey));
                      } else {
                        next.add(String(entryKey));
                      }
                      return next;
                    });
                  }}
                  className="flex items-center gap-2 w-full bg-transparent border-none p-0 cursor-pointer text-white text-xs"
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    <Icon
                      name="icon-chevron-right"
                      size={12}
                      className={cn(
                        'text-[#666] transition-transform duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                        {
                          'rotate-90': isEntryExpanded,
                        },
                      )}
                    />
                    <div className="whitespace-pre-wrap break-words text-left font-medium flex items-center gap-x-1.5">
                      {renderName(change.name)}

                      <CountBadge
                        count={change.count}
                        isFunction={typeof change.currentValue === 'function'}
                        showWarning={diff.changes.length === 0}
                        forceFlash
                        // showFlame={diff.changes.length === 0}
                        // showFn={typeof change.currentValue === 'function'}
                      />
                    </div>
                  </div>
                </button>
                <div
                  className={cn('react-scan-expandable', {
                    'react-scan-expanded': isEntryExpanded,
                  })}
                >
                  <div className="pl-3 text-xs font-mono border-l-1 border-[#333]">
                    <div className="flex flex-col gap-0.5">
                      {prevError || currError ? (
                        <AccessError
                          currError={currError}
                          prevError={prevError}
                        />
                      ) : diff.changes.length > 0 ? (
                        <DiffChange
                          change={change}
                          diff={diff}
                          expandedFns={expandedFns}
                          renderName={renderName}
                          setExpandedFns={setExpandedFns}
                          title={title}
                        />
                      ) : (
                        <ReferenceOnlyChange
                          currValue={currValue}
                          entryKey={entryKey}
                          expandedFns={expandedFns}
                          prevValue={prevValue}
                          setExpandedFns={setExpandedFns}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

const AccessError = ({
  prevError,
  currError,
}: {
  prevError?: string;
  currError?: string;
}) => {
  return (
    <>
      {prevError && (
        <div className="text-[#f87171] bg-[#2a1515] pr-1.5 py-[3px] rounded italic">
          {prevError}
        </div>
      )}
      {currError && (
        <div className="text-[#4ade80] bg-[#1a2a1a] pr-1.5 py-[3px] rounded italic mt-0.5">
          {currError}
        </div>
      )}
    </>
  );
};

const DiffChange = ({
  diff,
  title,
  renderName,
  change,
  expandedFns,
  setExpandedFns,
}: {
  diff: {
    changes: {
      path: string[];
      prevValue: unknown;
      currentValue: unknown;
    }[];
  };
  title: string;
  renderName: (name: string) => ReactNode;
  change: { name: string };
  expandedFns: Set<string>;
  setExpandedFns: (updater: (prev: Set<string>) => Set<string>) => void;
}) => {
  return diff.changes.map((diffChange, i) => {
    const { value: prevDiffValue, error: prevDiffError } = safeGetValue(
      diffChange.prevValue,
    );
    const { value: currDiffValue, error: currDiffError } = safeGetValue(
      diffChange.currentValue,
    );

    const isFunction =
      typeof prevDiffValue === 'function' ||
      typeof currDiffValue === 'function';

    let path: string | undefined;

    if (title === 'Props') {
      path =
        diffChange.path.length > 0
          ? `${renderName(String(change.name))}.${formatPath(diffChange.path)}`
          : undefined;
    }
    if (title === 'State' && diffChange.path.length > 0) {
      path = `state.${formatPath(diffChange.path)}`;
    }

    if (!path) {
      path = formatPath(diffChange.path);
    }

    return (
      <div
        key={`${path}-${change.name}-${i}`}
        className={cn(
          'flex flex-col gap-y-1',
          i < diff.changes.length - 1 && 'mb-4',
        )}
      >
        {path && <div className="text-[#666] text-[10px]">{path}</div>}
        <button
          type="button"
          className={cn(
            'group',
            'flex items-start',
            'py-[3px] px-1.5',
            'text-left text-[#f87171] bg-[#2a1515]',
            'rounded',
            'overflow-hidden break-all',
            isFunction && 'cursor-pointer',
          )}
          onClick={
            isFunction
              ? () => {
                  const fnKey = `${formatPath(diffChange.path)}-prev`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(fnKey)) {
                      next.delete(fnKey);
                    } else {
                      next.add(fnKey);
                    }
                    return next;
                  });
                }
              : undefined
          }
        >
          <span className="w-3 flex items-center justify-center opacity-50">
            -
          </span>
          <span className="flex-1 whitespace-nowrap font-mono">
            {prevDiffError ? (
              <span className="italic text-[#f87171]">{prevDiffError}</span>
            ) : isFunction ? (
              <div className="flex gap-1 items-start flex-col">
                <div className="flex gap-1 items-start w-full">
                  <span className="flex-1 max-h-40">
                    {formatFunctionPreview(
                      prevDiffValue as (...args: unknown[]) => unknown,
                      expandedFns.has(`${formatPath(diffChange.path)}-prev`),
                    )}
                  </span>
                  {typeof prevDiffValue === 'function' && (
                    <CopyToClipboard
                      text={prevDiffValue.toString()}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
                    </CopyToClipboard>
                  )}
                </div>
                {prevDiffValue?.toString() === currDiffValue?.toString() && (
                  <div className="text-[10px] text-[#666] italic">
                    Function reference changed
                  </div>
                )}
              </div>
            ) : (
              <DiffValueView
                value={prevDiffValue}
                expanded={expandedFns.has(
                  `${formatPath(diffChange.path)}-prev`,
                )}
                onToggle={() => {
                  const key = `${formatPath(diffChange.path)}-prev`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) {
                      next.delete(key);
                    } else {
                      next.add(key);
                    }
                    return next;
                  });
                }}
                isNegative={true}
              />
            )}
          </span>
        </button>
        <button
          type="button"
          className={cn(
            'group',
            'flex items-start',
            'py-[3px] px-1.5',
            'text-left text-[#4ade80] bg-[#1a2a1a]',
            'rounded',
            'overflow-hidden break-all',
            isFunction && 'cursor-pointer',
          )}
          onClick={
            isFunction
              ? () => {
                  const fnKey = `${formatPath(diffChange.path)}-current`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(fnKey)) {
                      next.delete(fnKey);
                    } else {
                      next.add(fnKey);
                    }
                    return next;
                  });
                }
              : undefined
          }
        >
          <span className="w-3 flex items-center justify-center opacity-50">
            +
          </span>
          <span className="flex-1 whitespace-pre-wrap font-mono">
            {currDiffError ? (
              <span className="italic text-[#4ade80]">{currDiffError}</span>
            ) : isFunction ? (
              <div className="flex gap-1 items-start flex-col">
                <div className="flex gap-1 items-start w-full">
                  <span className="flex-1">
                    {formatFunctionPreview(
                      currDiffValue as (...args: unknown[]) => unknown,
                      expandedFns.has(`${formatPath(diffChange.path)}-current`),
                    )}
                  </span>
                  {typeof currDiffValue === 'function' && (
                    <CopyToClipboard
                      text={currDiffValue.toString()}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {({ ClipboardIcon }) => <>{ClipboardIcon}</>}
                    </CopyToClipboard>
                  )}
                </div>
                {prevDiffValue?.toString() === currDiffValue?.toString() && (
                  <div className="text-[10px] text-[#666] italic">
                    Function reference changed
                  </div>
                )}
              </div>
            ) : (
              <DiffValueView
                value={currDiffValue}
                expanded={expandedFns.has(
                  `${formatPath(diffChange.path)}-current`,
                )}
                onToggle={() => {
                  const key = `${formatPath(diffChange.path)}-current`;
                  setExpandedFns((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) {
                      next.delete(key);
                    } else {
                      next.add(key);
                    }
                    return next;
                  });
                }}
                isNegative={false}
              />
            )}
          </span>
        </button>
      </div>
    );
  });
};

const ReferenceOnlyChange = ({
  prevValue,
  currValue,
  entryKey,
  expandedFns,
  setExpandedFns,
}: {
  prevValue: unknown;
  currValue: unknown;
  entryKey: string | number;
  expandedFns: Set<string>;
  setExpandedFns: (updater: (prev: Set<string>) => Set<string>) => void;
}) => {
  return (
    <>
      <div className="group flex gap-0.5 items-start text-[#f87171] bg-[#2a1515] py-[3px] px-1.5 rounded">
        <span className="w-3 flex items-center justify-center opacity-50">
          -
        </span>
        <span className="flex-1 overflow-hidden whitespace-pre-wrap font-mono">
          <DiffValueView
            value={prevValue}
            expanded={expandedFns.has(`${String(entryKey)}-prev`)}
            onToggle={() => {
              const key = `${String(entryKey)}-prev`;
              setExpandedFns((prev) => {
                const next = new Set(prev);
                if (next.has(key)) {
                  next.delete(key);
                } else {
                  next.add(key);
                }
                return next;
              });
            }}
            isNegative={true}
          />
        </span>
      </div>
      <div className="group flex gap-0.5 items-start text-[#4ade80] bg-[#1a2a1a] py-[3px] px-1.5 rounded mt-0.5">
        <span className="w-3 flex items-center justify-center opacity-50">
          +
        </span>
        <span className="flex-1 overflow-hidden whitespace-pre-wrap font-mono">
          <DiffValueView
            value={currValue}
            expanded={expandedFns.has(`${String(entryKey)}-current`)}
            onToggle={() => {
              const key = `${String(entryKey)}-current`;
              setExpandedFns((prev) => {
                const next = new Set(prev);
                if (next.has(key)) {
                  next.delete(key);
                } else {
                  next.add(key);
                }
                return next;
              });
            }}
            isNegative={false}
          />
        </span>
      </div>
      {typeof currValue === 'object' && currValue !== null && (
        <div className="text-[#666] text-[10px] italic mt-1 flex items-center gap-x-1">
          <Icon
            name="icon-triangle-alert"
            className="text-yellow-500 mb-px"
            size={14}
          />
          <span>Reference changed but objects are structurally the same</span>
        </div>
      )}
    </>
  );
};

const CountBadge = ({
  count,
  forceFlash,
  isFunction,
  showWarning,
}: {
  count: number;
  forceFlash: boolean;
  isFunction: boolean;
  showWarning: boolean;
}) => {
  const refIsFirstRender = useRef(true);
  const refBadge = useRef<HTMLDivElement>(null);
  const refPrevCount = useRef(count);

  useEffect(() => {
    const element = refBadge.current;
    if (!element || refPrevCount.current === count) {
      return;
    }

    element.classList.remove('count-flash');
    void element.offsetWidth;
    element.classList.add('count-flash');

    refPrevCount.current = count;
  }, [count]);

  useEffect(() => {
    if (refIsFirstRender.current) {
      refIsFirstRender.current = false;
      return;
    }

    if (forceFlash) {
      let timer = setTimeout(() => {
        refBadge.current?.classList.add('count-flash-white');
        timer = setTimeout(() => {
          refBadge.current?.classList.remove('count-flash-white');
        }, 300);
      }, 500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [forceFlash]);

  return (
    <div ref={refBadge} className="count-badge">
      {showWarning && (
        <Icon
          name="icon-triangle-alert"
          className="text-yellow-500 mb-px"
          size={14}
        />
      )}
      {isFunction && (
        <Icon name="icon-function" className="text-[#A855F7] mb-px" size={14} />
      )}
      x{count}
    </div>
  );
};
