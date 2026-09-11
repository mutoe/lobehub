import { type FlexboxProps } from '@lobehub/ui';
import { Flexbox, TooltipGroup } from '@lobehub/ui';
import { type CSSProperties, type ReactNode } from 'react';
import { memo } from 'react';

import ToggleLeftPanelButton, { isMacDesktop } from '@/features/NavPanel/ToggleLeftPanelButton';
import { useIsNavPanelOverlay } from '@/features/TabletLayout/useTabletNavPanelMode';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

export interface NavHeaderProps extends Omit<FlexboxProps, 'children'> {
  children?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  showTogglePanelButton?: boolean;
  slotClassNames?: {
    center?: string;
    left?: string;
    right?: string;
  };
  styles?: {
    center?: CSSProperties;
    left?: CSSProperties;
    right?: CSSProperties;
  };
}

const NavHeader = memo<NavHeaderProps>(
  ({
    showTogglePanelButton = true,
    style,
    children,
    left,
    right,
    slotClassNames,
    styles,
    ...rest
  }) => {
    const expand = useGlobalStore(systemStatusSelectors.showLeftPanel);
    const overlayNav = useIsNavPanelOverlay();

    const noContent = !left && !right && !children;

    // When empty, this header only rendered to host the collapse toggle. Hide it
    // when expanded, and also on macOS desktop where the toggle moved to the titlebar
    // (the toggle renders nothing there, so an overlay nav must not keep the bar).
    // Tablet overlay otherwise needs a persistent (not hover-gated) toggle.
    if (noContent && (isMacDesktop || (expand && !overlayNav))) return;

    return (
      <Flexbox
        allowShrink
        horizontal
        align={'center'}
        flex={'none'}
        gap={4}
        height={44}
        justify={'space-between'}
        padding={8}
        style={style}
        {...rest}
      >
        <TooltipGroup>
          <Flexbox
            allowShrink
            horizontal
            align={'center'}
            className={slotClassNames?.left}
            gap={2}
            justify={'flex-start'}
            style={styles?.left}
          >
            {showTogglePanelButton && (!expand || overlayNav) && (
              <ToggleLeftPanelButton id={overlayNav ? null : undefined} />
            )}
            {left}
          </Flexbox>
          {children && (
            <Flexbox className={slotClassNames?.center} flex={1} style={styles?.center}>
              {children}
            </Flexbox>
          )}
          <Flexbox
            horizontal
            align={'center'}
            className={slotClassNames?.right}
            gap={2}
            justify={'flex-end'}
            style={styles?.right}
          >
            {right}
          </Flexbox>
        </TooltipGroup>
      </Flexbox>
    );
  },
);

export default NavHeader;
