import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGlobalStore } from '@/store/global';

import { initialTabletLayoutState, useTabletLayoutStore } from './store';
import { useTabletNavPanelMode } from './useTabletNavPanelMode';

let tablet = true;
let portrait = false;
vi.mock('./useIsTabletViewport', () => ({ useIsTabletViewport: () => tablet }));
vi.mock('./useTabletOrientation', () => ({
  useTabletOrientation: () => (portrait ? 'portrait' : 'landscape'),
}));

describe('useTabletNavPanelMode', () => {
  beforeEach(() => {
    tablet = true;
    portrait = false;
    useTabletLayoutStore.setState(initialTabletLayoutState);
    useGlobalStore.setState({
      status: { ...useGlobalStore.getState().status, showLeftPanel: true },
    });
  });

  it('resolves the current orientation mode', () => {
    const { result } = renderHook(() => useTabletNavPanelMode());
    expect(result.current.mode).toBe('docked');
    expect(result.current.overlay).toBe(false);

    portrait = true;
    const portraitHook = renderHook(() => useTabletNavPanelMode());
    expect(portraitHook.result.current.mode).toBe('autoHide');
    expect(portraitHook.result.current.overlay).toBe(true);
    expect(portraitHook.result.current.dismissOnNavigate).toBe(true);
  });

  it('seeds the pre-overlay expand state when leaving docked from the open sidebar', () => {
    const { result } = renderHook(() => useTabletNavPanelMode());
    act(() => result.current.setMode('float'));

    const s = useTabletLayoutStore.getState();
    expect(s.navPanelModes.landscape).toBe('float');
    expect(s.navPanelExpandBeforeOverlay).toBe(true);
  });

  it('does not touch the saved state when switching between overlay modes', () => {
    useTabletLayoutStore.getState().setNavPanelMode('landscape', 'float');
    const { result } = renderHook(() => useTabletNavPanelMode());
    act(() => result.current.setMode('autoHide'));

    expect(useTabletLayoutStore.getState().navPanelExpandBeforeOverlay).toBeNull();
  });

  it('never overlays on desktop widths', () => {
    tablet = false;
    portrait = true;
    const { result } = renderHook(() => useTabletNavPanelMode());
    expect(result.current.overlay).toBe(false);
    expect(result.current.dismissOnNavigate).toBe(false);
  });
});
