'use client';

import { ActionIcon, Flexbox } from '@lobehub/ui';
import { FloatingSheet } from '@lobehub/ui/base-ui';
import { ChatHeader } from '@lobehub/ui/mobile';
import { createStaticStyles } from 'antd-style';
import { History, Plus } from 'lucide-react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import MobileContentLayout from '@/components/server/MobileNavLayout';
import { TopicUrlSync, type TopicUrlSyncStore } from '@/features/Generation';

import { GenerationTopicStoreProvider } from './Body/List/StoreContext';
import TopicList from './Body/List/TopicList';
import type { GenerationLayoutCommonProps } from './types';

const styles = createStaticStyles(({ css }) => ({
  mainContainer: css`
    overflow-y: hidden;
  `,
  sheetBody: css`
    overflow-y: auto;
    max-height: 60dvh;
    padding-block: 4px 16px;
    padding-inline: 12px;
  `,
  title: css`
    font-size: 16px;
    font-weight: 600;
  `,
}));

/**
 * Fork feature: mobile chrome for the image/video generation pages.
 *
 * Desktop renders the topic list in the nav sidebar (NavPanelPortal), which
 * doesn't exist on mobile — so the topic history moves into a bottom sheet,
 * and the `?topic=` URL sync (TopicUrlSync, mounted by the desktop layout at
 * GenerationLayout/index.tsx) must be mounted here too, inside the route tree,
 * to keep workspace switching working.
 */
const MobileGenerationLayout: FC<GenerationLayoutCommonProps> = ({
  breadcrumb,
  namespace,
  useStore,
}) => {
  const { t } = useTranslation(namespace);
  const [historyOpen, setHistoryOpen] = useState(false);

  const openNewGenerationTopic = useStore((s: any) => s.openNewGenerationTopic);
  const activeTopicId = useStore((s: any) => s.activeGenerationTopicId);

  // Tapping a topic in the sheet switches the workspace; close the sheet then
  useEffect(() => {
    setHistoryOpen(false);
  }, [activeTopicId]);

  return (
    <GenerationTopicStoreProvider value={{ namespace, useStore: useStore as any }}>
      <MobileContentLayout
        withNav
        className={styles.mainContainer}
        header={
          <ChatHeader
            center={<span className={styles.title}>{breadcrumb[0]?.title}</span>}
            right={
              <Flexbox horizontal gap={4}>
                <ActionIcon
                  icon={History}
                  title={t('topic.title')}
                  onClick={() => setHistoryOpen(true)}
                />
                <ActionIcon
                  icon={Plus}
                  title={t('topic.createNew')}
                  onClick={() => openNewGenerationTopic()}
                />
              </Flexbox>
            }
          />
        }
      >
        <Outlet />
      </MobileContentLayout>
      <TopicUrlSync useStore={useStore as unknown as TopicUrlSyncStore} />
      <FloatingSheet
        mode="overlay"
        open={historyOpen}
        title={t('topic.title')}
        onOpenChange={setHistoryOpen}
      >
        <Flexbox className={styles.sheetBody} gap={4}>
          <TopicList viewMode="list" />
        </Flexbox>
      </FloatingSheet>
    </GenerationTopicStoreProvider>
  );
};

export default MobileGenerationLayout;
