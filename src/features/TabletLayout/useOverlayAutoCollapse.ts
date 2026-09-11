import { useEffect, useRef } from 'react';

import { useTabletLayoutStore } from './store';

interface OverlayAutoCollapseParams {
  /** Whether the panel is currently in overlay mode. */
  enabled: boolean;
  /** Current persisted expanded state. */
  expand: boolean;
  /** Persisted status has hydrated — do not touch the store before that. */
  ready: boolean;
  toggle: (expand: boolean) => void;
}

/**
 * Collapse a persisted-open panel when overlay mode starts, and put it back
 * when overlay mode ends (a window dragged below the tablet width and back, a
 * tablet rotated from an auto-hide portrait to a docked landscape). Mirrors
 * `PortalAutoCollapse`: a viewport-driven collapse must not silently become
 * the user's persisted preference.
 *
 * The pre-overlay state lives in the persisted tablet store rather than a ref,
 * so a reload mid-session still restores it. While overlaid, the user's own
 * opens/closes are left alone; the restore only re-opens a panel the user has
 * not opened themselves in the meantime. A session that already has a saved
 * value when overlay starts (the user picked an overlay mode from the open
 * sidebar, or the page reloaded) is not collapsed again.
 */
export const useOverlayAutoCollapse = ({
  enabled,
  expand,
  ready,
  toggle,
}: OverlayAutoCollapseParams) => {
  const expandRef = useRef(expand);
  expandRef.current = expand;

  useEffect(() => {
    if (!ready) return;
    const { navPanelExpandBeforeOverlay: saved, setNavPanelExpandBeforeOverlay: setSaved } =
      useTabletLayoutStore.getState();

    if (enabled) {
      if (saved !== null) return;
      setSaved(expandRef.current);
      if (expandRef.current) toggle(false);
      return;
    }

    if (saved === null) return;
    if (saved && !expandRef.current) toggle(true);
    setSaved(null);
  }, [enabled, ready, toggle]);
};
