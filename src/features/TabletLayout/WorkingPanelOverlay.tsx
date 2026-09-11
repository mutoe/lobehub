'use client';

import { type ReactNode } from 'react';
import { memo } from 'react';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import OverlayRail from './OverlayRail';
import { useIsTabletViewport } from './useIsTabletViewport';

/**
 * Hangs the agent working sidebar off the right edge as an overlay on tablet
 * viewports. Desktop-wide rows render the child untouched (in-flow column).
 *
 * `AgentWorkingSidebar` already treats tablet as "always fits", so the panel's
 * expanded state here is exactly the persisted `showRightPanel`.
 */
const WorkingPanelOverlay = memo<{ children: ReactNode }>(({ children }) => {
  const tablet = useIsTabletViewport();
  const [showRightPanel, toggleRightPanel] = useGlobalStore((s) => [
    systemStatusSelectors.showRightPanel(s),
    s.toggleRightPanel,
  ]);

  return (
    <OverlayRail
      enabled={tablet}
      placement="right"
      showBackdrop={showRightPanel}
      onDismiss={() => toggleRightPanel(false)}
    >
      {children}
    </OverlayRail>
  );
});

WorkingPanelOverlay.displayName = 'WorkingPanelOverlay';

export default WorkingPanelOverlay;
