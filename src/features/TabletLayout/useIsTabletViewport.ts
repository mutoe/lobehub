import { useSyncExternalStore } from 'react';

import { TABLET_VIEWPORT_MEDIA } from '@/utils/tabletLayout';

const getMediaQuery = () =>
  typeof window === 'undefined' || typeof window.matchMedia !== 'function'
    ? undefined
    : window.matchMedia(TABLET_VIEWPORT_MEDIA);

const subscribe = (onChange: () => void) => {
  const mq = getMediaQuery();
  if (!mq) return () => {};
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

const getSnapshot = () => Boolean(getMediaQuery()?.matches);
const getServerSnapshot = () => false;

/**
 * True while the viewport is tablet-wide or narrower (≤ 1024 CSS px).
 *
 * Backed by `matchMedia` so consumers re-render only when the threshold is
 * crossed, not on every resize pixel — the virtualized chat list and every
 * `NavHeader` subscribe to this.
 */
export const useIsTabletViewport = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
