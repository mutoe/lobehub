import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initialTabletLayoutState, useTabletLayoutStore } from './store';
import { useOverlayAutoCollapse } from './useOverlayAutoCollapse';

interface Params {
  enabled: boolean;
  expand: boolean;
  ready: boolean;
}

const setup = (initial: Params) => {
  const toggle = vi.fn();
  const hook = renderHook((p: Params) => useOverlayAutoCollapse({ ...p, toggle }), {
    initialProps: initial,
  });
  return { ...hook, toggle };
};

const saved = () => useTabletLayoutStore.getState().navPanelExpandBeforeOverlay;

describe('useOverlayAutoCollapse', () => {
  beforeEach(() => {
    useTabletLayoutStore.setState(initialTabletLayoutState);
  });

  it('does nothing before the persisted status has hydrated', () => {
    const { toggle } = setup({ enabled: true, expand: true, ready: false });
    expect(toggle).not.toHaveBeenCalled();
    expect(saved()).toBeNull();
  });

  it('collapses a persisted-open panel once when overlay mode starts', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: true, ready: true });
    expect(toggle).toHaveBeenCalledWith(false);
    expect(saved()).toBe(true);

    // the user re-opens it while overlaid — that choice is left alone
    rerender({ enabled: true, expand: true, ready: true });
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('leaves a persisted-closed panel closed and does not reopen it afterwards', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: false, ready: true });
    expect(toggle).not.toHaveBeenCalled();
    expect(saved()).toBe(false);

    rerender({ enabled: false, expand: false, ready: true });
    expect(toggle).not.toHaveBeenCalled();
    expect(saved()).toBeNull();
  });

  it('restores the panel when overlay mode ends', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: true, ready: true });
    rerender({ enabled: true, expand: false, ready: true });

    rerender({ enabled: false, expand: false, ready: true });
    expect(toggle).toHaveBeenLastCalledWith(true);
    expect(saved()).toBeNull();
  });

  it('does not restore a panel the user already opened while overlaid', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: true, ready: true });
    rerender({ enabled: true, expand: true, ready: true });

    rerender({ enabled: false, expand: true, ready: true });
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(saved()).toBeNull();
  });

  it('restores from the persisted pre-overlay state after a reload mid-session', () => {
    // a previous page load collapsed the panel and persisted showLeftPanel=false
    useTabletLayoutStore.setState({ navPanelExpandBeforeOverlay: true });
    const { rerender, toggle } = setup({ enabled: true, expand: false, ready: true });
    expect(toggle).not.toHaveBeenCalled();

    rerender({ enabled: false, expand: false, ready: true });
    expect(toggle).toHaveBeenCalledWith(true);
    expect(saved()).toBeNull();
  });

  it('keeps an open panel open when overlay was chosen from inside it', () => {
    // setMode pre-seeds the saved state so entering overlay is not a collapse
    useTabletLayoutStore.setState({ navPanelExpandBeforeOverlay: true });
    const { toggle } = setup({ enabled: true, expand: true, ready: true });
    expect(toggle).not.toHaveBeenCalled();
    expect(saved()).toBe(true);
  });
});
