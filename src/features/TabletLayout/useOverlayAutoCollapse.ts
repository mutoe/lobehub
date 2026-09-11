import { useEffect, useRef } from 'react';

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
 * when overlay mode ends (a desktop window dragged below the tablet width and
 * back). Mirrors `PortalAutoCollapse`: a viewport-driven collapse must not
 * silently become the user's persisted preference.
 *
 * While overlaid, the user's own opens/closes are left alone; the restore
 * only re-opens a panel the user has not opened themselves in the meantime.
 */
export const useOverlayAutoCollapse = ({
  enabled,
  expand,
  ready,
  toggle,
}: OverlayAutoCollapseParams) => {
  const savedExpand = useRef<boolean | null>(null);
  const expandRef = useRef(expand);
  expandRef.current = expand;

  useEffect(() => {
    if (!ready) return;

    if (enabled) {
      if (savedExpand.current !== null) return;
      savedExpand.current = expandRef.current;
      if (expandRef.current) toggle(false);
      return;
    }

    if (savedExpand.current === null) return;
    if (savedExpand.current && !expandRef.current) toggle(true);
    savedExpand.current = null;
  }, [enabled, ready, toggle]);
};
