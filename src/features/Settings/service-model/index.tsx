'use client';

import { useTranslation } from 'react-i18next';

import { ModelAssignmentsForm } from '@/features/ServiceModel';
import SettingHeader from '@/features/Settings/features/SettingHeader';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import Image from '../image/features/Image';
import TextToSpeech from '../tts/features/TextToSpeech';

interface PageProps {
  showSettingHeader?: boolean;
}

const Page = ({ showSettingHeader = true }: PageProps) => {
  const { t } = useTranslation('setting');
  const { enableSTT, showAiImage } = useServerConfigStore(featureFlagsSelectors);
  return (
    <>
      {showSettingHeader && <SettingHeader title={t('tab.serviceModel')} />}
      <ModelAssignmentsForm />
      {enableSTT && <TextToSpeech />}
      {showAiImage && <Image />}
    </>
  );
};

export default Page;
