'use client';

import { createStaticStyles, cssVar } from 'antd-style';
import { type ReactNode } from 'react';
import { memo } from 'react';

import {
  overlayBackdropStyle,
  overlayPanelStyle,
  type OverlayPlacement,
  overlayRailHostStyle,
} from '@/utils/tabletLayout';

import { useEscapeDismiss } from './useEscapeDismiss';

const styles = createStaticStyles(({ css }) => ({
  backdrop: css`
    cursor: pointer;
    background: ${cssVar.colorBgMask};
  `,
}));

interface OverlayRailProps {
  children: ReactNode;
  /**
   * When true the child is taken out of flow (0-width host) and painted from
   * an absolutely positioned wrapper over the transcript.
   */
  enabled: boolean;
  onDismiss?: () => void;
  /** Which row edge the panel hangs from. */
  placement: OverlayPlacement;
  /**
   * Show the dimmed dismiss target. Usually the panel is actually open.
   */
  showBackdrop?: boolean;
}

/**
 * Zero-width flex host + optional backdrop for tablet overlay rails.
 *
 * The child (`DraggablePanel`) is left in normal flow inside the absolute
 * wrapper so its width-0 collapse still hides it.
 */
const OverlayRail = memo<OverlayRailProps>(
  ({ children, enabled, onDismiss, placement, showBackdrop }) => {
    const dismissible = enabled && Boolean(showBackdrop) && Boolean(onDismiss);
    useEscapeDismiss(dismissible, onDismiss);

    if (!enabled) return children;

    return (
      <>
        {dismissible && (
          <div
            className={styles.backdrop}
            role="presentation"
            style={overlayBackdropStyle}
            onClick={onDismiss}
          />
        )}
        <div style={overlayRailHostStyle}>
          <div style={overlayPanelStyle(placement)}>{children}</div>
        </div>
      </>
    );
  },
);

OverlayRail.displayName = 'OverlayRail';

export default OverlayRail;
