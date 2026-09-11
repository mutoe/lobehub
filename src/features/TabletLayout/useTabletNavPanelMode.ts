import { useCallback } from 'react';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import {
  type NavPanelLayout,
  resolveNavPanelLayout,
  type TabletNavPanelMode,
} from './navPanelMode';
import { selectNavPanelMode, useTabletLayoutStore } from './store';
import { useIsTabletViewport } from './useIsTabletViewport';
import { useTabletOrientation } from './useTabletOrientation';

export interface TabletNavPanelModeState extends NavPanelLayout {
  mode: TabletNavPanelMode;
  setMode: (mode: TabletNavPanelMode) => void;
  tablet: boolean;
}

/** The nav mode for the current orientation, plus the layout it resolves to. */
export const useTabletNavPanelMode = (): TabletNavPanelModeState => {
  const tablet = useIsTabletViewport();
  const orientation = useTabletOrientation();
  const mode = useTabletLayoutStore(selectNavPanelMode(orientation));
  const setNavPanelMode = useTabletLayoutStore((s) => s.setNavPanelMode);
  const setMode = useCallback(
    (next: TabletNavPanelMode) => {
      const store = useTabletLayoutStore.getState();
      const current = store.navPanelModes[orientation];
      const entersOverlay =
        tablet &&
        !resolveNavPanelLayout({ mode: current, tablet }).overlay &&
        resolveNavPanelLayout({ mode: next, tablet }).overlay;
      // The menu lives inside the open sidebar: choosing an overlay mode there
      // must not read as "collapse me". Seed the pre-overlay state so the
      // auto-collapse leaves the panel where it is.
      if (entersOverlay && store.navPanelExpandBeforeOverlay === null) {
        store.setNavPanelExpandBeforeOverlay(
          Boolean(systemStatusSelectors.showLeftPanel(useGlobalStore.getState())),
        );
      }
      setNavPanelMode(orientation, next);
    },
    [orientation, setNavPanelMode, tablet],
  );

  return { ...resolveNavPanelLayout({ mode, tablet }), mode, setMode, tablet };
};

/** Just the overlay bit, for chrome that only needs to know whether the nav floats. */
export const useIsNavPanelOverlay = (): boolean => useTabletNavPanelMode().overlay;
