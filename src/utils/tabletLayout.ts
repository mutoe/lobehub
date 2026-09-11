import type { CSSProperties } from 'react';

/**
 * Widest viewport that still gets the tablet layout. iPad portrait is 768,
 * landscape (and the 12.9" portrait width) is exactly 1024. Anything wider
 * keeps the desktop column layout untouched.
 */
export const TABLET_MAX_VIEWPORT_WIDTH = 1024;

/** `matchMedia` form of {@link TABLET_MAX_VIEWPORT_WIDTH}. */
export const TABLET_VIEWPORT_MEDIA = `(max-width: ${TABLET_MAX_VIEWPORT_WIDTH}px)`;

/** CSS `@media` form of {@link TABLET_VIEWPORT_MEDIA}. */
export const TABLET_VIEWPORT_CSS = `@media ${TABLET_VIEWPORT_MEDIA}`;

export const TABLET_OVERLAY_BACKDROP_Z = 20;
export const TABLET_OVERLAY_PANEL_Z = 21;

export const isTabletViewport = (viewportWidth?: number): boolean =>
  typeof viewportWidth === 'number' &&
  viewportWidth > 0 &&
  viewportWidth <= TABLET_MAX_VIEWPORT_WIDTH;

export type OverlayPlacement = 'left' | 'right';

/**
 * Zero-width flex item that anchors an overlay panel. Taking no in-flow width
 * is what hands the whole row back to the transcript.
 */
export const overlayRailHostStyle: CSSProperties = {
  flexShrink: 0,
  height: '100%',
  position: 'relative',
  width: 0,
};

/**
 * Absolutely positioned wrapper *around* a `DraggablePanel`. The panel itself
 * stays in normal flow inside this wrapper so its own collapse mechanics
 * (outer `width: 0; overflow: hidden`) keep working — putting `position:
 * absolute` on the panel's inner Resizable would escape that clip and pin the
 * panel open.
 */
export const overlayPanelStyle = (placement: OverlayPlacement): CSSProperties => ({
  height: '100%',
  insetBlockStart: 0,
  position: 'absolute',
  zIndex: TABLET_OVERLAY_PANEL_Z,
  ...(placement === 'left' ? { insetInlineStart: 0 } : { insetInlineEnd: 0 }),
});

export const overlayBackdropStyle: CSSProperties = {
  inset: 0,
  position: 'fixed',
  zIndex: TABLET_OVERLAY_BACKDROP_Z,
};
