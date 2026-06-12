'use client';

import { useTranslation } from 'react-i18next';

import MobileGenerationLayout from '@/routes/(main)/(create)/features/GenerationLayout/Mobile';
import { useVideoStore } from '@/store/video';
import { generationTopicSelectors } from '@/store/video/slices/generationTopic/selectors';

const MobileVideoLayout = () => {
  const { t } = useTranslation(['common']);

  return (
    <MobileGenerationLayout
      breadcrumb={[{ href: '/video', title: t('tab.video') }]}
      generationTopicsSelector={generationTopicSelectors.generationTopics}
      namespace="video"
      navKey="video"
      useStore={useVideoStore}
      viewModeStatusKey="videoTopicViewMode"
    />
  );
};

export default MobileVideoLayout;
