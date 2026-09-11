import { useSyncExternalStore } from 'react';

const getMediaQuery = (query: string) =>
  typeof window === 'undefined' || typeof window.matchMedia !== 'function'
    ? undefined
    : window.matchMedia(query);

/**
 * `matchMedia`-backed boolean. Consumers re-render only when the query flips,
 * not on every resize pixel. False during SSR and where `matchMedia` is missing.
 */
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      const mq = getMediaQuery(query);
      if (!mq) return () => {};
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => Boolean(getMediaQuery(query)?.matches),
    () => false,
  );
