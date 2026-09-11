'use client';

import { ActionIcon, type DropdownItem, DropdownMenu } from '@lobehub/ui/base-ui';
import { EyeOff, Layers, PanelLeftClose, Pin } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DESKTOP_HEADER_ICON_SMALL_SIZE } from '@/const/layoutTokens';
import { TOGGLE_BUTTON_ID } from '@/features/NavPanel/ToggleLeftPanelButton';
import { useGlobalStore } from '@/store/global';

import { TABLET_NAV_PANEL_MODES, type TabletNavPanelMode } from './navPanelMode';
import { useTabletNavPanelMode } from './useTabletNavPanelMode';

const MODE_ICONS = { autoHide: EyeOff, docked: Pin, float: Layers } as const;

export type NavPanelModeLabels = Record<TabletNavPanelMode | 'collapse', string>;

interface BuildItemsParams {
  labels: NavPanelModeLabels;
  mode: TabletNavPanelMode;
  onCollapse: () => void;
  onSelect: (mode: TabletNavPanelMode) => void;
}

/** Three exclusive layout modes, then the plain collapse the button used to be. */
export const buildNavPanelModeItems = ({
  labels,
  mode,
  onCollapse,
  onSelect,
}: BuildItemsParams): DropdownItem[] => [
  ...TABLET_NAV_PANEL_MODES.map((candidate) => ({
    checked: candidate === mode,
    closeOnClick: true,
    icon: MODE_ICONS[candidate],
    key: candidate,
    label: labels[candidate],
    onCheckedChange: () => onSelect(candidate),
    type: 'checkbox' as const,
  })),
  { type: 'divider' },
  {
    icon: PanelLeftClose,
    key: 'collapse',
    label: labels.collapse,
    onClick: onCollapse,
  },
];

/**
 * Tablet replacement for the in-sidebar collapse button: the same icon in the
 * same slot (so the hover-reveal CSS keyed on `TOGGLE_BUTTON_ID` still
 * applies), but opening a menu to pick docked / float / auto-hide for the
 * current orientation, with collapse as the last entry.
 */
const NavPanelModeMenu = memo(() => {
  const { t } = useTranslation('common');
  const { mode, setMode } = useTabletNavPanelMode();
  const togglePanel = useGlobalStore((s) => s.toggleLeftPanel);

  const items = useMemo(
    () =>
      buildNavPanelModeItems({
        labels: {
          autoHide: t('navPanel.mode.autoHide'),
          collapse: t('navPanel.mode.collapse'),
          docked: t('navPanel.mode.docked'),
          float: t('navPanel.mode.float'),
        },
        mode,
        onCollapse: () => togglePanel(false),
        onSelect: setMode,
      }),
    [mode, setMode, t, togglePanel],
  );

  return (
    <DropdownMenu items={items} placement="bottomRight">
      <ActionIcon
        icon={PanelLeftClose}
        id={TOGGLE_BUTTON_ID}
        size={DESKTOP_HEADER_ICON_SMALL_SIZE}
        title={t('navPanel.mode.title')}
      />
    </DropdownMenu>
  );
});

NavPanelModeMenu.displayName = 'NavPanelModeMenu';

export default NavPanelModeMenu;
