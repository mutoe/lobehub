'use client';

import { Flexbox } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import MobileContentLayout from '@/components/server/MobileNavLayout';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { usePathname } from '@/libs/router/navigation';

const styles = createStaticStyles(({ css, cssVar }) => ({
  mainContainer: css`
    position: relative;
    overflow: hidden;
    background: ${cssVar.colorBgContainer};
  `,
  tab: css`
    cursor: pointer;

    flex: none;

    padding-block: 5px;
    padding-inline: 12px;
    border-radius: 16px;

    font-size: 13px;
    color: ${cssVar.colorTextSecondary};
  `,
  tabActive: css`
    font-weight: 500;
    color: ${cssVar.colorText};
    background: ${cssVar.colorFillSecondary};
  `,
  tabs: css`
    scrollbar-width: none;
    overflow-x: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
}));

const TABS = [
  { key: 'home', titleKey: 'tab.home', url: '/memory' },
  { key: 'identities', titleKey: 'tab.identities', url: '/memory/identities' },
  { key: 'contexts', titleKey: 'tab.contexts', url: '/memory/contexts' },
  { key: 'preferences', titleKey: 'tab.preferences', url: '/memory/preferences' },
  { key: 'experiences', titleKey: 'tab.experiences', url: '/memory/experiences' },
  { key: 'activities', titleKey: 'tab.activities', url: '/memory/activities' },
] as const;

/**
 * Fork feature: mobile chrome for the memory pages.
 *
 * Desktop hosts the sub-page navigation in the nav sidebar (NavPanelPortal),
 * which has no consumer on mobile — replaced here by a horizontal tab row.
 * The pages themselves are reused as-is: their NavHeader collapses to the
 * right-side action bar on mobile (`showLeftPanel` defaults to true, so the
 * panel toggle never renders).
 */
const MobileMemoryLayout = memo(() => {
  const { t } = useTranslation('memory');
  const navigate = useWorkspaceAwareNavigate();
  const pathname = usePathname();
  const activeKey = pathname.split('/memory/')[1]?.split('/')[0] || 'home';

  return (
    <MobileContentLayout
      withNav
      className={styles.mainContainer}
      header={
        <Flexbox
          horizontal
          align={'center'}
          className={styles.tabs}
          flex={'none'}
          gap={4}
          padding={8}
        >
          {TABS.map((tab) => (
            <div
              className={cx(styles.tab, activeKey === tab.key && styles.tabActive)}
              key={tab.key}
              onClick={() => navigate(tab.url)}
            >
              {t(tab.titleKey)}
            </div>
          ))}
        </Flexbox>
      }
    >
      <Outlet />
    </MobileContentLayout>
  );
});

MobileMemoryLayout.displayName = 'MobileMemoryLayout';

export default MobileMemoryLayout;
