import { type OpenAITTSOptions, type TTSOptions } from '@lobehub/tts/react';
import { useOpenAITTS } from '@lobehub/tts/react';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import { useTTSRuntimeConfig } from './useTTSRuntimeConfig';

interface TTSConfig extends TTSOptions {
  onUpload?: (currentVoice: string, arraybuffers: ArrayBuffer[]) => void;
  voice?: string;
}

export const useTTS = (content: string, config?: TTSConfig) => {
  const voice = useAgentStore(agentSelectors.currentAgentTTSVoice);
  // Fork: which service speaks (OpenAI / Fish Audio) is resolved here.
  const { api, options, voiceIdentity } = useTTSRuntimeConfig(config?.voice || voice);

  return useOpenAITTS(content, {
    ...config,
    ...({ api, options } as OpenAITTSOptions),
    onFinish: (arraybuffers) => {
      config?.onUpload?.(voiceIdentity, arraybuffers);
    },
  });
};
