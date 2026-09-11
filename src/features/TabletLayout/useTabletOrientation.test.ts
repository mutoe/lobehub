import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PORTRAIT_MEDIA, useTabletOrientation } from './useTabletOrientation';

type ChangeListener = (e: { matches: boolean }) => void;

const stubMatchMedia = (portrait: boolean) => {
  const listeners = new Set<ChangeListener>();
  const mq = {
    addEventListener: (_: 'change', cb: ChangeListener) => listeners.add(cb),
    matches: portrait,
    media: PORTRAIT_MEDIA,
    removeEventListener: (_: 'change', cb: ChangeListener) => listeners.delete(cb),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      expect(query).toBe(PORTRAIT_MEDIA);
      return mq;
    }),
  );
  return {
    rotate: (next: boolean) => {
      mq.matches = next;
      listeners.forEach((cb) => cb({ matches: next }));
    },
  };
};

describe('useTabletOrientation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('follows the orientation media query', () => {
    const media = stubMatchMedia(true);
    const { result } = renderHook(() => useTabletOrientation());
    expect(result.current).toBe('portrait');

    act(() => media.rotate(false));
    expect(result.current).toBe('landscape');
  });

  it('is landscape when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => useTabletOrientation()).result.current).toBe('landscape');
  });
});
