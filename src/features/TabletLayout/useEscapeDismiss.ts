import { useEffect } from 'react';

/**
 * Calls `onDismiss` on Escape while `active`. Keyboard counterpart to an
 * overlay's click-to-dismiss backdrop.
 */
export const useEscapeDismiss = (active: boolean, onDismiss?: () => void) => {
  useEffect(() => {
    if (!active || !onDismiss) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, onDismiss]);
};
