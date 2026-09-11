'use client';

import { memo } from 'react';

import ToggleLeftPanelButton from '@/features/NavPanel/ToggleLeftPanelButton';

import NavPanelModeMenu from './NavPanelModeMenu';
import { useIsTabletViewport } from './useIsTabletViewport';

/** The sidebar header's own toggle: a mode menu on tablets, the plain button elsewhere. */
const NavPanelHeaderToggle = memo(() =>
  useIsTabletViewport() ? <NavPanelModeMenu /> : <ToggleLeftPanelButton />,
);

NavPanelHeaderToggle.displayName = 'NavPanelHeaderToggle';

export default NavPanelHeaderToggle;
