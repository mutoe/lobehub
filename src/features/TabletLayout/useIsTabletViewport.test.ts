import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TABLET_VIEWPORT_MEDIA } from '@/utils/tabletLayout';

import { useIsTabletViewport } from './useIsTabletViewport';

type ChangeListener = (e: { matches: boolean }) => void;

const stubMatchMedia = (matches: boolean) => {
  const listeners = new Set<ChangeListener>();
  const mq = {
    addEventListener: (_: 'change', cb: ChangeListener) => listeners.add(cb),
    matches,
    media: '',
    removeEventListener: (_: 'change', cb: ChangeListener) => listeners.delete(cb),
  };
  const matchMedia = vi.fn((query: string) => {
    expect(query).toBe(TABLET_VIEWPORT_MEDIA);
    return mq;
  });
  vi.stubGlobal('matchMedia', matchMedia);

  return {
    fire: (next: boolean) => {
      mq.matches = next;
      listeners.forEach((cb) => cb({ matches: next }));
    },
    listeners,
  };
};

describe('useIsTabletViewport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the tablet media query on first render', () => {
    stubMatchMedia(true);
    expect(renderHook(() => useIsTabletViewport()).result.current).toBe(true);

    stubMatchMedia(false);
    expect(renderHook(() => useIsTabletViewport()).result.current).toBe(false);
  });

  it('updates when the threshold is crossed and unsubscribes on unmount', () => {
    const media = stubMatchMedia(false);
    const { result, unmount } = renderHook(() => useIsTabletViewport());

    act(() => media.fire(true));
    expect(result.current).toBe(true);

    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it('is false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => useIsTabletViewport()).result.current).toBe(false);
  });
});
