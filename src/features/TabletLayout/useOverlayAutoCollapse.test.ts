import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('useOverlayAutoCollapse', () => {
  it('does nothing before the persisted status has hydrated', () => {
    const { toggle } = setup({ enabled: true, expand: true, ready: false });
    expect(toggle).not.toHaveBeenCalled();
  });

  it('collapses a persisted-open panel once when overlay mode starts', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: true, ready: true });
    expect(toggle).toHaveBeenCalledWith(false);

    // the user re-opens it while overlaid — that choice is left alone
    rerender({ enabled: true, expand: true, ready: true });
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('leaves an already-collapsed panel alone', () => {
    const { toggle } = setup({ enabled: true, expand: false, ready: true });
    expect(toggle).not.toHaveBeenCalled();
  });

  // A desktop window dragged below the tablet width and back must not end up
  // with the nav permanently collapsed in localStorage.
  it('restores the pre-overlay state when overlay mode ends', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: true, ready: true });
    toggle.mockClear();

    rerender({ enabled: false, expand: false, ready: true });
    expect(toggle).toHaveBeenCalledWith(true);
  });

  it('does not re-open a panel the user opened themselves while overlaid', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: true, ready: true });
    toggle.mockClear();

    rerender({ enabled: true, expand: true, ready: true });
    rerender({ enabled: false, expand: true, ready: true });
    expect(toggle).not.toHaveBeenCalled();
  });

  it('does not open a panel that was closed before overlay mode started', () => {
    const { rerender, toggle } = setup({ enabled: true, expand: false, ready: true });

    rerender({ enabled: false, expand: false, ready: true });
    expect(toggle).not.toHaveBeenCalled();
  });
});
