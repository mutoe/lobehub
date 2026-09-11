import { useEffect, useRef } from 'react';

interface DismissOnNavigateParams {
  /** The overlay is open and dismissible. */
  active: boolean;
  onDismiss: () => void;
  /** Current route pathname; a change while `active` dismisses the overlay. */
  pathname: string;
}

/**
 * Close an overlay rail once the user has picked a destination in it. Every
 * nav entry (topics, profile, a topic row) renders into the transcript column
 * the rail is covering, so leaving the rail up would only hide what was just
 * opened. Mount and the rail opening on an already-changed path are not
 * navigations.
 */
export const useDismissOnNavigate = ({ active, onDismiss, pathname }: DismissOnNavigateParams) => {
  const lastPathname = useRef(pathname);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (pathname === lastPathname.current) return;
    lastPathname.current = pathname;
    if (active) onDismissRef.current();
  }, [active, pathname]);
};
