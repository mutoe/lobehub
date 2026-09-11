import { TABLET_VIEWPORT_MEDIA } from '@/utils/tabletLayout';

import { useMediaQuery } from './useMediaQuery';

/**
 * True while the viewport is tablet-wide or narrower (≤ 1024 CSS px).
 *
 * Backed by `matchMedia` so consumers re-render only when the threshold is
 * crossed, not on every resize pixel — the virtualized chat list and every
 * `NavHeader` subscribe to this.
 */
export const useIsTabletViewport = (): boolean => useMediaQuery(TABLET_VIEWPORT_MEDIA);
