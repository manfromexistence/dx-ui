import { computed, untracked, useSignalEffect } from '@preact/signals';
import type { Fiber } from 'bippy';
import { Component } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import { signalIsSettingsOpen, signalWidgetViews } from '~web/state';
import { cn } from '~web/utils/helpers';
import { constant } from '~web/utils/preact/constant';
import { ComponentsTree } from './components-tree';
import { flashManager } from './flash-overlay';
import {
  type TimelineUpdate,
  inspectorUpdateSignal,
  timelineActions,
} from './states';
import {
  collectInspectorData,
  getStateNames,
  resetTracking,
} from './timeline/utils';
import { extractMinimalFiberInfo, getCompositeFiberFromElement } from './utils';
import { WhatChanged } from './what-changed';

export const globalInspectorState = {
  lastRendered: new Map<string, unknown>(),
  expandedPaths: new Set<string>(),
  cleanup: () => {
    globalInspectorState.lastRendered.clear();
    globalInspectorState.expandedPaths.clear();
    flashManager.cleanupAll();
    resetTracking();
    timelineActions.reset();
  },
};

// todo: add reset button and error message
class InspectorErrorBoundary extends Component {
  state: { error: Error | null; hasError: boolean } = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    globalInspectorState.cleanup();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-950/50 h-screen backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3 text-red-400 font-medium">
            <Icon name="icon-flame" className="text-red-500" size={16} />
            Something went wrong in the inspector
          </div>
          <div className="p-3 bg-black/40 rounded font-mono text-xs text-red-300 mb-4 break-words">
            {this.state.error?.message || JSON.stringify(this.state.error)}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            Reset Inspector
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const inspectorContainerClassName = computed(() =>
  cn(
    'react-scan-inspector',
    'flex-1',
    'opacity-0',
    'overflow-y-auto overflow-x-hidden',
    'transition-opacity delay-0',
    'pointer-events-none',
    !signalIsSettingsOpen.value && 'opacity-100 delay-300 pointer-events-auto',
  ),
);

const Inspector = /* @__PURE__ */ constant(() => {
  const refLastInspectedFiber = useRef<Fiber | null>(null);

  // NOTE(Alexis): no need for useCallback
  const processUpdate = (fiber: Fiber) => {
    if (!fiber) return;

    refLastInspectedFiber.current = fiber;
    const { data: inspectorData, shouldUpdate } = collectInspectorData(fiber);

    if (shouldUpdate) {
      const update: TimelineUpdate = {
        timestamp: Date.now(),
        fiberInfo: extractMinimalFiberInfo(fiber),
        props: inspectorData.fiberProps,
        state: inspectorData.fiberState,
        context: inspectorData.fiberContext,
        stateNames: getStateNames(fiber),
      };

      timelineActions.addUpdate(update, fiber);
    }
  };

  useSignalEffect(() => {
    const state = Store.inspectState.value;
    untracked(() => {
      if (state.kind !== 'focused' || !state.focusedDomElement) {
        refLastInspectedFiber.current = null;
        globalInspectorState.cleanup();
        return;
      }

      if (state.kind === 'focused') {
        signalIsSettingsOpen.value = false;
      }

      const { parentCompositeFiber } = getCompositeFiberFromElement(
        state.focusedDomElement,
        state.fiber,
      );

      if (!parentCompositeFiber) {
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
        signalWidgetViews.value = {
          view: 'none',
        };
        return;
      }

      const isNewComponent =
        refLastInspectedFiber.current?.type !== parentCompositeFiber.type;

      if (isNewComponent) {
        refLastInspectedFiber.current = parentCompositeFiber;
        globalInspectorState.cleanup();
        processUpdate(parentCompositeFiber);
      }
    });
  });

  useSignalEffect(() => {
    // NOTE(Alexis): just track
    inspectorUpdateSignal.value;
    untracked(() => {
      const inspectState = Store.inspectState.value;
      if (inspectState.kind !== 'focused' || !inspectState.focusedDomElement) {
        refLastInspectedFiber.current = null;
        globalInspectorState.cleanup();
        return;
      }

      const { parentCompositeFiber } = getCompositeFiberFromElement(
        inspectState.focusedDomElement,
        inspectState.fiber,
      );

      if (!parentCompositeFiber) {
        Store.inspectState.value = {
          kind: 'inspect-off',
        };
        signalWidgetViews.value = {
          view: 'none',
        };
        return;
      }

      processUpdate(parentCompositeFiber);

      if (!inspectState.focusedDomElement.isConnected) {
        refLastInspectedFiber.current = null;
        globalInspectorState.cleanup();
        Store.inspectState.value = {
          kind: 'inspecting',
          hoveredDomElement: null,
        };
      }
    });
  });

  useEffect(() => {
    return () => {
      globalInspectorState.cleanup();
    };
  }, []);

  return (
    <InspectorErrorBoundary>
      <div className={inspectorContainerClassName}>
        <div className="w-full h-full">
          <WhatChanged />
        </div>
      </div>
    </InspectorErrorBoundary>
  );
});

export const ViewInspector = /* @__PURE__ */ constant(() => {
  if (Store.inspectState.value.kind !== 'focused') return null;
  return (
    <InspectorErrorBoundary>
      <Inspector />
      <ComponentsTree />
    </InspectorErrorBoundary>
  );
});
