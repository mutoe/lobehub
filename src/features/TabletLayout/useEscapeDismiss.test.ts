import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useEscapeDismiss } from './useEscapeDismiss';

const pressEscape = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

describe('useEscapeDismiss', () => {
  it('dismisses on Escape while active', () => {
    const onDismiss = vi.fn();
    renderHook(() => useEscapeDismiss(true, onDismiss));

    pressEscape();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while inactive and after unmount', () => {
    const onDismiss = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ active }: { active: boolean }) => useEscapeDismiss(active, onDismiss),
      { initialProps: { active: false } },
    );

    pressEscape();
    expect(onDismiss).not.toHaveBeenCalled();

    rerender({ active: true });
    unmount();
    pressEscape();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
