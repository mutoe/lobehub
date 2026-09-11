import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEscapeDismiss } from './useEscapeDismiss';

const pressEscape = (target: EventTarget = window) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));

afterEach(() => {
  document.body.innerHTML = '';
});

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

  it('still dismisses when a document-level handler stops propagation', () => {
    // base-ui `useDismiss` closes an open tooltip/popover on Escape from a
    // `document` keydown listener and calls stopPropagation(), so a bubbling
    // window listener never sees the key.
    const stopper = (e: KeyboardEvent) => e.stopPropagation();
    document.addEventListener('keydown', stopper);
    const onDismiss = vi.fn();
    renderHook(() => useEscapeDismiss(true, onDismiss));

    const link = document.createElement('a');
    document.body.append(link);
    pressEscape(link);

    document.removeEventListener('keydown', stopper);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it.each(['dialog', 'alertdialog', 'menu', 'listbox'])(
    'leaves Escape to an open %s when the key originates inside it',
    (role) => {
      const onDismiss = vi.fn();
      renderHook(() => useEscapeDismiss(true, onDismiss));

      const popup = document.createElement('div');
      popup.setAttribute('role', role);
      const button = document.createElement('button');
      popup.append(button);
      document.body.append(popup);

      pressEscape(button);
      expect(onDismiss).not.toHaveBeenCalled();

      pressEscape(document.body);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    },
  );
});
