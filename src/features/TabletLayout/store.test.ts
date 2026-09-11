import { beforeEach, describe, expect, it } from 'vitest';

import {
  initialTabletLayoutState,
  selectNavPanelMode,
  TABLET_LAYOUT_STORAGE_KEY,
  useTabletLayoutStore,
} from './store';

describe('useTabletLayoutStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useTabletLayoutStore.setState(initialTabletLayoutState);
  });

  it('defaults per orientation', () => {
    const s = useTabletLayoutStore.getState();
    expect(selectNavPanelMode('landscape')(s)).toBe('docked');
    expect(selectNavPanelMode('portrait')(s)).toBe('autoHide');
  });

  it('remembers each orientation independently and persists it', () => {
    useTabletLayoutStore.getState().setNavPanelMode('portrait', 'float');

    const s = useTabletLayoutStore.getState();
    expect(selectNavPanelMode('portrait')(s)).toBe('float');
    expect(selectNavPanelMode('landscape')(s)).toBe('docked');

    const raw = JSON.parse(localStorage.getItem(TABLET_LAYOUT_STORAGE_KEY)!);
    expect(raw.state).toEqual({
      navPanelExpandBeforeOverlay: null,
      navPanelModes: { landscape: 'docked', portrait: 'float' },
    });
  });

  it('falls back to defaults for unknown persisted values', async () => {
    localStorage.setItem(
      TABLET_LAYOUT_STORAGE_KEY,
      JSON.stringify({ state: { navPanelModes: { landscape: 'pinned', portrait: 'float' } } }),
    );
    await useTabletLayoutStore.persist.rehydrate();

    expect(useTabletLayoutStore.getState().navPanelModes).toEqual({
      landscape: 'docked',
      portrait: 'float',
    });
  });

  it('persists the pre-overlay expand state across a reload', async () => {
    localStorage.setItem(
      TABLET_LAYOUT_STORAGE_KEY,
      JSON.stringify({ state: { navPanelExpandBeforeOverlay: true } }),
    );
    await useTabletLayoutStore.persist.rehydrate();
    expect(useTabletLayoutStore.getState().navPanelExpandBeforeOverlay).toBe(true);
  });
});
