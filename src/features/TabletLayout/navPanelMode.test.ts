import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TABLET_NAV_PANEL_MODES,
  isTabletNavPanelMode,
  resolveNavPanelLayout,
} from './navPanelMode';

describe('resolveNavPanelLayout', () => {
  it('never overlays on desktop widths regardless of mode', () => {
    for (const mode of ['docked', 'float', 'autoHide'] as const) {
      expect(resolveNavPanelLayout({ mode, tablet: false })).toEqual({
        dismissOnNavigate: false,
        overlay: false,
      });
    }
  });

  it('docked tablet keeps the in-flow column', () => {
    expect(resolveNavPanelLayout({ mode: 'docked', tablet: true })).toEqual({
      dismissOnNavigate: false,
      overlay: false,
    });
  });

  it('float overlays but survives navigation', () => {
    expect(resolveNavPanelLayout({ mode: 'float', tablet: true })).toEqual({
      dismissOnNavigate: false,
      overlay: true,
    });
  });

  it('autoHide overlays and closes on navigation', () => {
    expect(resolveNavPanelLayout({ mode: 'autoHide', tablet: true })).toEqual({
      dismissOnNavigate: true,
      overlay: true,
    });
  });
});

describe('defaults', () => {
  it('docks in landscape and auto-hides in portrait', () => {
    expect(DEFAULT_TABLET_NAV_PANEL_MODES).toEqual({ landscape: 'docked', portrait: 'autoHide' });
  });

  it('guards persisted values', () => {
    expect(isTabletNavPanelMode('float')).toBe(true);
    expect(isTabletNavPanelMode('pinned')).toBe(false);
    expect(isTabletNavPanelMode(undefined)).toBe(false);
  });
});
