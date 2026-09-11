import { createStaticStyles } from 'antd-style';

import { HOVER_NONE_CSS } from '@/utils/hoverNone';
import { TABLET_VIEWPORT_CSS } from '@/utils/tabletLayout';

/**
 * `re-resizable` handle class for a left-placed `DraggablePanel` (the handle
 * sits on the panel's trailing edge).
 */
export const NAV_PANEL_RESIZE_HANDLE = '.ant-draggable-panel-right-handle';

/**
 * Visible grip for the nav panel's resize edge.
 *
 * `DraggablePanel` renders the handle as a transparent 10px strip straddling
 * the panel edge, so nothing tells the user the edge is draggable. The grip is
 * a pill painted on the panel's own `::after` (positioned off the panel edge,
 * not the handle, so it survives the handle geometry changing between pointer
 * types) and lets pointer events fall through to the handle underneath.
 *
 * Desktop mirrors the collapse button: revealed on panel hover, darker on
 * handle hover, primary while dragging. Tablet viewports and touch pointers
 * have no hover to discover it with, so there it stays on.
 */
export const resizeGripStyles = createStaticStyles(({ css, cssVar }) => ({
  host: css`
    &::after {
      pointer-events: none;
      content: '';

      position: absolute;
      z-index: 1;
      inset-block-start: 50%;
      inset-inline-end: 1px;
      transform: translateY(-50%);

      width: 4px;
      height: 36px;
      border-radius: 2px;

      opacity: 0;
      background: ${cssVar.colorFill};

      transition:
        opacity 0.2s ${cssVar.motionEaseOut},
        background 0.2s ${cssVar.motionEaseOut};
    }

    &:hover::after {
      opacity: 1;
    }

    &:has(${NAV_PANEL_RESIZE_HANDLE}:hover)::after {
      background: ${cssVar.colorTextTertiary};
    }

    &:has(${NAV_PANEL_RESIZE_HANDLE}:active)::after {
      opacity: 1;
      background: ${cssVar.colorPrimary};
    }

    ${TABLET_VIEWPORT_CSS} {
      &::after {
        opacity: 1;
      }
    }

    ${HOVER_NONE_CSS} {
      &::after {
        opacity: 1;
      }

      /* The handle straddles the panel edge and the outer half is clipped by
         the panel's overflow, leaving ~5px for a finger. Pull it fully inside
         and widen it where there is no hover cursor to find it with. */
      ${NAV_PANEL_RESIZE_HANDLE} {
        inset-inline-end: 0;
        transform: none;
        width: 20px;
      }
    }
  `,
}));
