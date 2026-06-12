'use client';

import { ChatHeader } from '@lobehub/ui/mobile';
import { createStaticStyles } from 'antd-style';
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
  title: css`
    font-size: 16px;
    font-weight: 600;
  `,
}));

/**
 * Fork feature: mobile chrome for the resource / library pages.
 *
 * Desktop hosts the library navigation in the nav sidebar (NavPanelPortal),
 * which has no consumer on mobile. The ResourceManager pages are reused
 * as-is; library detail pages get a back button instead of the sidebar,
 * and hide the bottom tab bar for more screen room.
 */
const MobileResourceLayout = memo(() => {
  const { t } = useTranslation('common');
  const navigate = useWorkspaceAwareNavigate();
  const pathname = usePathname();
  const isLibrary = pathname.includes('/library/');

  return (
    <MobileContentLayout
      className={styles.mainContainer}
      withNav={!isLibrary}
      header={
        <ChatHeader
          center={<span className={styles.title}>{t('tab.resource')}</span>}
          showBackButton={isLibrary}
          onBackClick={() => navigate('/resource')}
        />
      }
    >
      <Outlet />
    </MobileContentLayout>
  );
});

MobileResourceLayout.displayName = 'MobileResourceLayout';

export default MobileResourceLayout;
