import { useEffect, useState } from 'preact/hooks';
import { Store } from '~core/index';
import { Icon } from '~web/components/icon';
import { useDelayedValue } from '~web/hooks/use-delayed-value';
import { signalWidgetViews } from '~web/state';
import { cn } from '~web/utils/helpers';
import { HeaderInspect } from '~web/views/inspector/header';
import { getOverrideMethods } from '~web/views/inspector/utils';

// const REPLAY_DELAY_MS = 300;

export const BtnReplay = () => {
  // const refTimeout = useRef<TTimer>();
  // const replayState = useRef({
  //   isReplaying: false,
  //   toggleDisabled: (disabled: boolean, button: HTMLElement) => {
  //     button.classList[disabled ? 'add' : 'remove']('disabled');
  //   },
  // });

  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const { overrideProps } = getOverrideMethods();
    const canEdit = !!overrideProps;

    requestAnimationFrame(() => {
      setCanEdit(canEdit);
    });
  }, []);

  // const handleReplay = (e: MouseEvent) => {
  //   e.stopPropagation();
  //   const { overrideProps, overrideHookState } = getOverrideMethods();
  //   const state = replayState.current;
  //   const button = e.currentTarget as HTMLElement;

  //   const inspectState = Store.inspectState.value;
  //   if (state.isReplaying || inspectState.kind !== 'focused') return;

  //   const { parentCompositeFiber } = getCompositeComponentFromElement(
  //     inspectState.focusedDomElement,
  //   );
  //   if (!parentCompositeFiber || !overrideProps || !overrideHookState) return;

  //   state.isReplaying = true;
  //   state.toggleDisabled(true, button);

  //   void replayComponent(parentCompositeFiber)
  //     .catch(() => void 0)
  //     .finally(() => {
  //       clearTimeout(refTimeout.current);
  //       if (document.hidden) {
  //         state.isReplaying = false;
  //         state.toggleDisabled(false, button);
  //       } else {
  //         refTimeout.current = setTimeout(() => {
  //           state.isReplaying = false;
  //           state.toggleDisabled(false, button);
  //         }, REPLAY_DELAY_MS);
  //       }
  //     });
  // };

  if (!canEdit) return null;

  return (
    <button
      type="button"
      title="Replay component"
      // onClick={handleReplay}
      className="react-scan-replay-button"
    >
      <Icon name="icon-replay" />
    </button>
  );
};

// const useSubscribeFocusedFiber = (onUpdate: () => void) => {
//   // biome-ignore lint/correctness/useExhaustiveDependencies: no deps
//   useEffect(() => {
//     const subscribe = () => {
//       if (Store.inspectState.value.kind !== 'focused') {
//         return;
//       }
//       onUpdate();
//     };

//     const unSubReportTime = Store.lastReportTime.subscribe(subscribe);
//     const unSubState = Store.inspectState.subscribe(subscribe);
//     return () => {
//       unSubReportTime();
//       unSubState();
//     };
//   }, []);
// };

export const Header = () => {
  const isInitialView = useDelayedValue(
    Store.inspectState.value.kind === 'focused',
    150,
    0,
  );
  const handleClose = () => {
    signalWidgetViews.value = {
      view: 'none',
    };
    Store.inspectState.value = {
      kind: 'inspect-off',
    };
  };

  const isHeaderIsNotifications =
    signalWidgetViews.value.view === 'notifications';

  if (isHeaderIsNotifications) {
    return;
  }

  return (
    <div className="react-scan-header">
      <div className="relative flex-1 h-full">
        <div
          className={cn(
            'react-scan-header-item is-visible',
            !isInitialView && '!duration-0',
          )}
        >
          <HeaderInspect />
        </div>
      </div>

      {/* {Store.inspectState.value.kind !== 'inspect-off' && <BtnReplay />} */}
      <button
        type="button"
        title="Close"
        className="react-scan-close-button"
        onClick={handleClose}
      >
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
