import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import {
  DEFAULT_TABLET_NAV_PANEL_MODES,
  isTabletNavPanelMode,
  type TabletNavPanelMode,
  type TabletOrientation,
} from './navPanelMode';

export const TABLET_LAYOUT_STORAGE_KEY = 'LOBE_TABLET_LAYOUT';

export interface TabletLayoutState {
  /**
   * `showLeftPanel` as it was before an overlay session collapsed it, or null
   * outside a session. Persisted so a reload or rotation mid-session can still
   * hand the column back instead of treating the collapse as the user's choice.
   */
  navPanelExpandBeforeOverlay: boolean | null;
  navPanelModes: Record<TabletOrientation, TabletNavPanelMode>;
}

export interface TabletLayoutStore extends TabletLayoutState {
  setNavPanelExpandBeforeOverlay: (expand: boolean | null) => void;
  setNavPanelMode: (orientation: TabletOrientation, mode: TabletNavPanelMode) => void;
}

/**
 * Resolve `localStorage` per call rather than once at module load: it is absent
 * during SSR, and test setups swap the instance between cases.
 */
const lazyLocalStorage: StateStorage = {
  getItem: (key) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(key)),
  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
};

export const initialTabletLayoutState: TabletLayoutState = {
  navPanelExpandBeforeOverlay: null,
  navPanelModes: { ...DEFAULT_TABLET_NAV_PANEL_MODES },
};

/**
 * Fork-only tablet preferences, kept out of the upstream global store so the
 * persisted `status` shape stays untouched. One nav mode per orientation: an
 * iPad rotated to landscape gets its column back without touching portrait.
 */
export const useTabletLayoutStore = createWithEqualityFn<TabletLayoutStore>()(
  persist(
    (set) => ({
      ...initialTabletLayoutState,
      setNavPanelExpandBeforeOverlay: (expand) => set({ navPanelExpandBeforeOverlay: expand }),
      setNavPanelMode: (orientation, mode) =>
        set((s) => ({ navPanelModes: { ...s.navPanelModes, [orientation]: mode } })),
    }),
    {
      merge: (persisted, current) => {
        const stored = persisted as Partial<TabletLayoutState> | undefined;
        const navPanelModes = { ...current.navPanelModes };
        for (const orientation of ['portrait', 'landscape'] as const) {
          const value = stored?.navPanelModes?.[orientation];
          if (isTabletNavPanelMode(value)) navPanelModes[orientation] = value;
        }
        const saved = stored?.navPanelExpandBeforeOverlay;
        return {
          ...current,
          navPanelExpandBeforeOverlay: typeof saved === 'boolean' ? saved : null,
          navPanelModes,
        };
      },
      name: TABLET_LAYOUT_STORAGE_KEY,
      partialize: (s) => ({
        navPanelExpandBeforeOverlay: s.navPanelExpandBeforeOverlay,
        navPanelModes: s.navPanelModes,
      }),
      storage: createJSONStorage(() => lazyLocalStorage),
    },
  ),
  shallow,
);

export const selectNavPanelMode =
  (orientation: TabletOrientation) =>
  (s: TabletLayoutState): TabletNavPanelMode =>
    s.navPanelModes[orientation];
