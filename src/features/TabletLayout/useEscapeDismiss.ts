import { useEffect } from 'react';

/**
 * Popups that own the Escape key while they are open. An Escape pressed from
 * inside one of these closes that popup, not the overlay behind it.
 */
const ESCAPE_OWNER_SELECTOR =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

const isInsideEscapeOwner = (target: EventTarget | null): boolean =>
  target instanceof Element && Boolean(target.closest(ESCAPE_OWNER_SELECTOR));

/**
 * Calls `onDismiss` on Escape while `active`. Keyboard counterpart to an
 * overlay's click-to-dismiss backdrop.
 *
 * Listens in the capture phase: base-ui's `useDismiss` closes an open
 * tooltip / popover from a `document` keydown listener and stops propagation,
 * which would otherwise swallow the first Escape whenever a row tooltip is
 * showing (e.g. right after tapping a topic). Escapes that originate inside a
 * dialog or menu are left to that popup.
 */
export const useEscapeDismiss = (active: boolean, onDismiss?: () => void) => {
  useEffect(() => {
    if (!active || !onDismiss) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isInsideEscapeOwner(e.target)) return;
      onDismiss();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [active, onDismiss]);
};
