'use client';

import { type MenuProps } from '@lobehub/ui';
import { Icon } from '@lobehub/ui';
import { LucideCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { agentChatConfigSelectors } from '@/store/agent/selectors';

type MenuItem = NonNullable<MenuProps['items']>[number];

/**
 * Fork feature: streaming-output toggle for the send-button menu.
 *
 * Same switch as Params → "Enable Streaming Output" (`chatConfig.enableStreaming`),
 * surfaced where it is actually needed. Some OpenAI-compatible relays report
 * upstream failures (content moderation, quota, channel errors) correctly on the
 * non-streaming endpoint but swallow them in streaming mode — answering HTTP 200
 * with a bare `data: [DONE]`, which reaches lobehub as an unexplained empty
 * completion. Turning streaming off makes those relays report the real reason.
 *
 * Shares the existing `setting:settingChat.enableStreaming.title` copy so the two
 * entry points can never drift apart.
 *
 * Deliberately a persisted toggle rather than a one-shot send: threading a
 * per-request override through the send path would mean touching six upstream
 * layers (including the shared `SendMessageParams` type) or duplicating
 * `handleSend`. The one-shot case is already covered by the "retry without
 * streaming" action on the empty-completion error.
 */
export const useStreamingToggleMenuItem = (): MenuItem => {
  const { t } = useTranslation('setting');

  const enableStreaming = useAgentStore(
    (s) => agentChatConfigSelectors.currentChatConfig(s).enableStreaming,
  );
  const updateAgentChatConfig = useAgentStore((s) => s.updateAgentChatConfig);

  // Undefined means "not configured" — upstream treats that as enabled
  // (`stream: chatConfig.enableStreaming !== false`), so mirror that here.
  const isOn = enableStreaming !== false;

  return useMemo(
    () => ({
      icon: isOn ? <Icon icon={LucideCheck} /> : <div />,
      key: 'enableStreaming',
      label: t('settingChat.enableStreaming.title'),
      onClick: () => {
        void updateAgentChatConfig({ enableStreaming: !isOn });
      },
    }),
    [isOn, t, updateAgentChatConfig],
  );
};
