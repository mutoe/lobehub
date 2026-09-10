import { useCallback, useEffect, useRef, useState } from 'react';

import { useGlobalStore } from '@/store/global';

/**
 * Fork-only: drives the mobile "advanced params" bottom sheet.
 *
 * The Plus menu's params item calls `openWorkingSidebar('params')`, which on
 * desktop reveals the right-hand working sidebar. The mobile chat page mounts
 * no such sidebar, so the tap silently did nothing. Watch the request nonce
 * that action bumps and open a drawer instead.
 *
 * Only requests made *after* mount count: `showRightPanel` and the request
 * live in persisted system status, so a stale value from an earlier session
 * must not pop the sheet at launch.
 */
export const useMobileParamsDrawer = () => {
  const request = useGlobalStore((s) => s.status.workingSidebarTabRequest);
  const toggleRightPanel = useGlobalStore((s) => s.toggleRightPanel);
  const [open, setOpen] = useState(false);
  const seenNonce = useRef(request?.nonce);

  useEffect(() => {
    if (!request || request.nonce === seenNonce.current) return;
    seenNonce.current = request.nonce;
    if (request.tab === 'params') setOpen(true);
  }, [request]);

  const close = useCallback(() => {
    setOpen(false);
    // The Plus menu highlights its params item while `showRightPanel` is on, and
    // its next tap would *close* the (non-existent) panel instead of reopening.
    toggleRightPanel(false);
  }, [toggleRightPanel]);

  return { close, open };
};
