import { type TabletOrientation } from './navPanelMode';
import { useMediaQuery } from './useMediaQuery';

export const PORTRAIT_MEDIA = '(orientation: portrait)';

/** Which way the tablet is held; each orientation remembers its own nav mode. */
export const useTabletOrientation = (): TabletOrientation =>
  useMediaQuery(PORTRAIT_MEDIA) ? 'portrait' : 'landscape';
