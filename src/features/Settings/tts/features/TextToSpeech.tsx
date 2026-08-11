'use client';

import { FishAudio as FishAudioIcon, OpenAI as OpenAIIcon } from '@lobehub/icons';
import { type FormGroupItemType } from '@lobehub/ui';
import { Form, Icon, Input, InputPassword, Skeleton, Tooltip } from '@lobehub/ui';
import { Select, type SelectProps } from '@lobehub/ui/base-ui';
import isEqual from 'fast-deep-equal';
import { Loader2Icon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LabelRenderer } from '@/components/ModelSelect';
import { isValidFishAudioReferenceId } from '@/const/fishAudio';
import { FORM_STYLE } from '@/const/layoutTokens';
import { serviceModelFormStyles } from '@/features/ServiceModel/styles';
import { SettingsSearchAnchor } from '@/features/SettingsSearch/anchor';
import { usePermission } from '@/hooks/usePermission';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';

import OpenAI from './OpenAI';

const ttsServiceOptions: SelectProps['options'] = [
  {
    label: <LabelRenderer Icon={OpenAIIcon.Avatar} label={'OpenAI'} />,
    value: 'openai',
  },
  {
    label: <LabelRenderer Icon={FishAudioIcon.Avatar} label={'Fish Audio'} />,
    value: 'fishaudio',
  },
];

/**
 * Fork: pick which service speaks, then show only that service's settings.
 *
 * Replaces the bare `<OpenAI />` group on the service-model page. The OpenAI group is
 * still upstream's component — it is just conditionally mounted, so a user who switched to
 * Fish Audio is not left staring at an OpenAI model picker that no longer does anything.
 */
const TextToSpeech = memo(() => {
  const { t } = useTranslation('setting');
  const { allowed: canManageServiceModel, reason } = usePermission('manage_settings');
  const [form] = Form.useForm();
  const { tts } = useUserStore(settingsSelectors.currentSettings, isEqual);
  const ttsService = useUserStore((s) => settingsSelectors.currentTTS(s).ttsService);
  const [setSettings, isUserStateInit] = useUserStore((s) => [s.setSettings, s.isUserStateInit]);
  const [loading, setLoading] = useState(false);

  if (!isUserStateInit) return <Skeleton active paragraph={{ rows: 3 }} title={false} />;

  const isFishAudio = ttsService === 'fishaudio';

  const service: FormGroupItemType = {
    children: [
      {
        className: serviceModelFormStyles.centeredLabel,
        children: (
          <Tooltip title={reason}>
            <Select
              disabled={!canManageServiceModel}
              options={ttsServiceOptions}
              style={{ width: 'min(100%, 448px)' }}
            />
          </Tooltip>
        ),
        label: (
          <SettingsSearchAnchor id={'service-model-tts-service'}>
            {t('settingTTS.ttsService.title')}
          </SettingsSearchAnchor>
        ),
        name: 'ttsService',
      },
      ...(isFishAudio
        ? [
            {
              children: (
                <InputPassword
                  autoComplete={'new-password'}
                  disabled={!canManageServiceModel}
                  placeholder={t('settingTTS.fishAudio.apiKey.placeholder')}
                />
              ),
              desc: t('settingTTS.fishAudio.apiKey.desc'),
              label: (
                <SettingsSearchAnchor id={'service-model-tts-fishaudio-key'}>
                  {t('settingTTS.fishAudio.apiKey.title')}
                </SettingsSearchAnchor>
              ),
              name: ['fishAudio', 'apiKey'],
            },
            {
              children: (
                <Input
                  disabled={!canManageServiceModel}
                  placeholder={t('settingTTS.fishAudio.referenceId.placeholder')}
                />
              ),
              desc: t('settingTTS.fishAudio.referenceId.desc'),
              label: (
                <SettingsSearchAnchor id={'service-model-tts-fishaudio-voice'}>
                  {t('settingTTS.fishAudio.referenceId.title')}
                </SettingsSearchAnchor>
              ),
              name: ['fishAudio', 'referenceId'],
              rules: [
                {
                  // Catch a malformed paste here rather than as a Fish Audio 400 later.
                  // Empty is valid and means "use the stock voice".
                  validator: async (_: unknown, value?: string) => {
                    if (!value || isValidFishAudioReferenceId(value.trim())) return;
                    throw new Error(t('settingTTS.fishAudio.referenceId.invalid'));
                  },
                },
              ],
            },
          ]
        : []),
    ],
    extra: loading && <Icon spin icon={Loader2Icon} size={16} style={{ opacity: 0.5 }} />,
    title: t('settingTTS.tts'),
  };

  return (
    <>
      <Form
        collapsible={false}
        form={form}
        initialValues={tts}
        items={[service]}
        itemsType={'group'}
        variant={'filled'}
        onValuesChange={async (values) => {
          if (!canManageServiceModel) return;

          setLoading(true);
          await setSettings({ tts: values });
          setLoading(false);
        }}
        {...FORM_STYLE}
        itemMinWidth={undefined}
      />
      {!isFishAudio && <OpenAI />}
    </>
  );
});

export default TextToSpeech;
