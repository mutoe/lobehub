'use client';

import { Drawer } from '@lobehub/ui/base-ui';
import type { PropsWithChildren } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OverlayContainerContext } from '@/features/NavPanel/OverlayContainer';
import { useFetchTopics } from '@/hooks/useFetchTopics';
import { useWorkspaceModal } from '@/hooks/useWorkspaceModal';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

const Topics = memo(({ children }: PropsWithChildren) => {
  const [showAgentSettings, toggleConfig] = useGlobalStore((s) => [
    systemStatusSelectors.mobileShowTopic(s),
    s.toggleMobileTopic,
  ]);
  const [open, setOpen] = useWorkspaceModal(showAgentSettings, toggleConfig);
  const { t } = useTranslation('topic');
  const [overlayContainer, setOverlayContainer] = useState<HTMLDivElement | null>(null);

  useFetchTopics();

  return (
    <OverlayContainerContext value={overlayContainer}>
      {/* Fork: a bottom sheet instead of a centered modal — on a phone the modal
          floated mid-screen with the composer peeking out underneath. */}
      <Drawer
        height={'90%'}
        open={open}
        placement={'bottom'}
        title={t('title')}
        styles={{
          bodyContent: { height: '100%', minHeight: 0, overflow: 'hidden', padding: '0 16px' },
          panel: { borderStartEndRadius: 16, borderStartStartRadius: 16 },
        }}
        onClose={() => setOpen(false)}
      >
        <div ref={setOverlayContainer} style={{ height: '100%' }}>
          {children}
        </div>
      </Drawer>
    </OverlayContainerContext>
  );
});

export default Topics;
