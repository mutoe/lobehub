'use client';

import { useTranslation } from 'react-i18next';

import MobileGenerationLayout from '@/routes/(main)/(create)/features/GenerationLayout/Mobile';
import { useImageStore } from '@/store/image';
import { generationTopicSelectors } from '@/store/image/slices/generationTopic/selectors';

const MobileImageLayout = () => {
  const { t } = useTranslation(['common']);

  return (
    <MobileGenerationLayout
      breadcrumb={[{ href: '/image', title: t('tab.image') }]}
      generationTopicsSelector={generationTopicSelectors.generationTopics}
      namespace="image"
      navKey="image"
      useStore={useImageStore}
      viewModeStatusKey="imageTopicViewMode"
    />
  );
};

export default MobileImageLayout;
