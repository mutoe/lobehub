import { createStaticStyles } from 'antd-style';

import { HOVER_NONE_CSS } from '@/utils/hoverNone';
import { TABLET_VIEWPORT_CSS } from '@/utils/tabletLayout';

/**
 * `re-resizable` handle class for a left-placed `DraggablePanel` (the handle
 * sits on the panel's trailing edge).
 */
export const NAV_PANEL_RESIZE_HANDLE = '.ant-draggable-panel-right-handle';

/** Chip footprint; the handle is widened to cover it so the chip is grabbable. */
const CHIP_WIDTH = 12;
const CHIP_INSET = 2;

/**
 * Visible grip for the nav panel's resize edge.
 *
 * `DraggablePanel` renders the handle as a transparent strip straddling the
 * panel edge, so nothing tells the user the edge is draggable. The grip is a
 * small bordered chip (`::before`) carrying a 2×3 dot glyph (`::after`) —
 * the conventional "drag me" mark, deliberately unlike the thin scrollbar
 * thumb that also lives on this edge. Both are painted on the panel's own
 * pseudo-elements with pointer events falling through to the handle, which
 * is pulled fully inside the panel so the whole chip is grabbable.
 *
 * Desktop mirrors the collapse button: revealed on panel hover, dots darker on
 * handle hover, primary while dragging. Tablet viewports and touch pointers
 * have no hover to discover it with, so there it stays on.
 */
export const resizeGripStyles = createStaticStyles(({ css, cssVar }) => ({
  host: css`
    &::before,
    &::after {
      pointer-events: none;
      content: '';

      position: absolute;
      z-index: 1;
      inset-block-start: 50%;
      transform: translateY(-50%);

      opacity: 0;

      transition:
        opacity 0.2s ${cssVar.motionEaseOut},
        background-color 0.2s ${cssVar.motionEaseOut},
        border-color 0.2s ${cssVar.motionEaseOut};
    }

    /* chip */
    &::before {
      inset-inline-end: ${CHIP_INSET}px;

      width: ${CHIP_WIDTH}px;
      height: 36px;
      border: 1px solid ${cssVar.colorBorderSecondary};
      border-radius: 6px;

      background: ${cssVar.colorBgElevated};
      box-shadow: ${cssVar.boxShadowTertiary};
    }

    /* 2 × 3 dot glyph, 1px dots on a 4px lattice */
    &::after {
      inset-inline-end: ${CHIP_INSET + 2}px;

      width: 8px;
      height: 12px;

      background-image: radial-gradient(
        circle,
        ${cssVar.colorTextQuaternary} 1px,
        transparent 1.4px
      );
      background-size: 4px 4px;
    }

    &:hover::before,
    &:hover::after {
      opacity: 1;
    }

    &:has(${NAV_PANEL_RESIZE_HANDLE}:hover)::after {
      background-image: radial-gradient(circle, ${cssVar.colorTextTertiary} 1px, transparent 1.4px);
    }

    &:has(${NAV_PANEL_RESIZE_HANDLE}:active)::before {
      border-color: ${cssVar.colorPrimary};
      opacity: 1;
    }

    &:has(${NAV_PANEL_RESIZE_HANDLE}:active)::after {
      opacity: 1;
      background-image: radial-gradient(circle, ${cssVar.colorPrimary} 1px, transparent 1.4px);
    }

    /* The handle straddles the panel edge and the outer half is clipped by the
       panel's overflow. Pull it fully inside so it covers the chip. re-resizable
       sizes the handle inline, hence the !important. */
    ${NAV_PANEL_RESIZE_HANDLE} {
      inset-inline-end: 0 !important;
      width: ${CHIP_WIDTH + CHIP_INSET * 2}px !important;
    }

    ${TABLET_VIEWPORT_CSS} {
      &::before,
      &::after {
        opacity: 1;
      }
    }

    ${HOVER_NONE_CSS} {
      &::before,
      &::after {
        opacity: 1;
      }

      /* Wider still where a finger, not a cursor, has to land on it. */
      ${NAV_PANEL_RESIZE_HANDLE} {
        width: 20px !important;
      }
    }
  `,
}));
