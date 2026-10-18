import { describe, expect, it } from 'vitest';

import {
  isTabletViewport,
  overlayBackdropStyle,
  overlayPanelStyle,
  overlayRailHostStyle,
  TABLET_MAX_VIEWPORT_WIDTH,
  TABLET_VIEWPORT_MEDIA,
} from './tabletLayout';

describe('isTabletViewport', () => {
  it('keeps the desktop layout until a real viewport is known', () => {
    expect(isTabletViewport()).toBe(false);
    expect(isTabletViewport(0)).toBe(false);
  });

  it('covers both iPad orientations', () => {
    expect(isTabletViewport(768)).toBe(true);
    expect(isTabletViewport(1024)).toBe(true);
  });

  it('leaves laptop widths on the desktop column layout', () => {
    expect(isTabletViewport(1025)).toBe(false);
    expect(isTabletViewport(1280)).toBe(false);
    expect(isTabletViewport(1366)).toBe(false);
  });

  it('exposes the same threshold as a media query', () => {
    expect(TABLET_VIEWPORT_MEDIA).toBe(`(max-width: ${TABLET_MAX_VIEWPORT_WIDTH}px)`);
  });
});

describe('overlay geometry', () => {
  it('takes no in-flow width so the transcript can use the full row', () => {
    expect(overlayRailHostStyle.width).toBe(0);
    expect(overlayRailHostStyle.position).toBe('relative');
  });

  it('anchors the panel wrapper to the requested edge', () => {
    expect(overlayPanelStyle('left')).toMatchObject({
      insetInlineStart: 0,
      position: 'absolute',
    });
    expect(overlayPanelStyle('left')).not.toHaveProperty('insetInlineEnd');
    expect(overlayPanelStyle('right')).toMatchObject({
      insetInlineEnd: 0,
      position: 'absolute',
    });
    expect(overlayBackdropStyle.position).toBe('fixed');
  });
});
