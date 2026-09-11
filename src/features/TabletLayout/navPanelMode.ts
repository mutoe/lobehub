/**
 * How the left nav behaves on a tablet-wide viewport.
 *
 * - `docked`: in-flow column, exactly the desktop layout (resizable, no overlay)
 * - `float`: hangs over the transcript behind a backdrop; stays put across
 *   navigation, closes on backdrop / Esc / the toggle
 * - `autoHide`: like `float`, and also closes as soon as a destination is picked
 */
export type TabletNavPanelMode = 'docked' | 'float' | 'autoHide';

export type TabletOrientation = 'portrait' | 'landscape';

export const TABLET_NAV_PANEL_MODES: readonly TabletNavPanelMode[] = [
  'docked',
  'float',
  'autoHide',
];

/** Landscape has room for a real column; portrait does not. */
export const DEFAULT_TABLET_NAV_PANEL_MODES: Readonly<
  Record<TabletOrientation, TabletNavPanelMode>
> = {
  landscape: 'docked',
  portrait: 'autoHide',
};

export const isTabletNavPanelMode = (value: unknown): value is TabletNavPanelMode =>
  typeof value === 'string' && (TABLET_NAV_PANEL_MODES as readonly string[]).includes(value);

export interface NavPanelLayout {
  /** Close the overlay once the route changes. */
  dismissOnNavigate: boolean;
  /** Paint the nav as an overlay rail instead of an in-flow column. */
  overlay: boolean;
}

/** Pure decision behind `NavPanelDraggable` / `NavHeader`: desktop widths never overlay. */
export const resolveNavPanelLayout = ({
  mode,
  tablet,
}: {
  mode: TabletNavPanelMode;
  tablet: boolean;
}): NavPanelLayout => ({
  dismissOnNavigate: tablet && mode === 'autoHide',
  overlay: tablet && mode !== 'docked',
});
