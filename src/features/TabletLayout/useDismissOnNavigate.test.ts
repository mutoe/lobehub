import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDismissOnNavigate } from './useDismissOnNavigate';

interface Params {
  active: boolean;
  pathname: string;
}

const setup = (initial: Params) => {
  const onDismiss = vi.fn();
  const hook = renderHook((p: Params) => useDismissOnNavigate({ ...p, onDismiss }), {
    initialProps: initial,
  });
  return { ...hook, onDismiss };
};

describe('useDismissOnNavigate', () => {
  it('does not dismiss on mount, only once the pathname changes', () => {
    const { rerender, onDismiss } = setup({ active: true, pathname: '/agent/a' });
    expect(onDismiss).not.toHaveBeenCalled();

    rerender({ active: true, pathname: '/agent/a' });
    expect(onDismiss).not.toHaveBeenCalled();

    rerender({ active: true, pathname: '/agent/a/tpc_1' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores navigation while inactive', () => {
    const { rerender, onDismiss } = setup({ active: false, pathname: '/agent/a' });

    rerender({ active: false, pathname: '/agent/a/tpc_1' });
    expect(onDismiss).not.toHaveBeenCalled();

    // becoming active on an already-changed path is not a navigation
    rerender({ active: true, pathname: '/agent/a/tpc_1' });
    expect(onDismiss).not.toHaveBeenCalled();

    rerender({ active: true, pathname: '/agent/a/tpc_2' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses the latest onDismiss without re-firing on identity change', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      (p: { onDismiss: () => void; pathname: string }) =>
        useDismissOnNavigate({ active: true, ...p }),
      { initialProps: { onDismiss: first, pathname: '/a' } },
    );

    rerender({ onDismiss: second, pathname: '/a' });
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    rerender({ onDismiss: second, pathname: '/b' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
