import { type TTSServer } from '@lobechat/types';
import { type OpenAITTSOptions } from '@lobehub/tts/react';
import isEqual from 'fast-deep-equal';

import { useBusinessTTSProvider } from '@/business/client/hooks/useBusinessTTSProvider';
import { DEFAULT_FISH_AUDIO_TTS_MODEL, FISH_AUDIO_API_KEY_HEADER_KEY } from '@/const/fishAudio';
import { createHeaderWithOpenAI } from '@/services/_header';
import { API_ENDPOINTS } from '@/services/_url';
import { serverConfigSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';

/**
 * Fork: resolve which speech service `useTTS` should talk to, and with what payload.
 *
 * The whole Fish Audio integration rides on one property of `@lobehub/tts`: once an
 * `api.serviceUrl` is configured, `OpenAITTS.fetch` POSTs `{input, options}` to it verbatim
 * and never touches OpenAI's protocol. So `/webapi/tts/<service>` is really just a
 * "take JSON, return audio" contract, and swapping services needs no new client-side
 * segmenting, streaming or caching machinery — only a different URL and payload.
 */

/**
 * The voice string persisted next to a generated audio file; when it stops matching, the
 * cached file is regenerated.
 *
 * OpenAI intentionally keeps its bare voice name so every already-stored `'alloy'` still
 * compares equal after this change — only non-OpenAI services get a namespace, which is
 * what makes switching services invalidate stale audio.
 */
export const getTTSVoiceIdentity = (service: TTSServer, voice: string): string =>
  service === 'openai' ? voice : `${service}:${voice}`;

/**
 * Business deployments route every TTS request through their own provider, so the fork's
 * service switch must not hijack them.
 */
const useResolvedTTSService = (): TTSServer => {
  const ttsService = useUserStore((s) => settingsSelectors.currentTTS(s).ttsService);
  const enableBusinessFeatures = useServerConfigStore(serverConfigSelectors.enableBusinessFeatures);

  return enableBusinessFeatures ? 'openai' : ttsService;
};

/**
 * The identity of the voice that would speak right now — used to decide whether a message's
 * cached audio is still current.
 *
 * @param agentVoice the agent's OpenAI voice; ignored by services that pick their voice globally.
 */
export const useTTSVoiceIdentity = (agentVoice: string): string => {
  const service = useResolvedTTSService();
  const referenceId = useUserStore(
    (s) => settingsSelectors.currentTTS(s).fishAudio?.referenceId ?? '',
  );

  return getTTSVoiceIdentity(service, service === 'fishaudio' ? referenceId : agentVoice);
};

export interface TTSRuntimeConfig {
  // `OpenAITTSAPI.headers` is narrowed to `Headers` upstream even though the value is only
  // ever forwarded to `fetch`, which takes any `HeadersInit`. Keep the honest type here and
  // let the call site do the one cast into the package's shape.
  api: { headers: HeadersInit; serviceUrl: string };
  options: OpenAITTSOptions['options'];
  /** Pass to `onUpload` so the generated file records the voice it was made with. */
  voiceIdentity: string;
}

export const useTTSRuntimeConfig = (agentVoice: string): TTSRuntimeConfig => {
  const ttsSettings = useUserStore(settingsSelectors.currentTTS, isEqual);
  const businessTTSProvider = useBusinessTTSProvider();
  const enableBusinessFeatures = useServerConfigStore(serverConfigSelectors.enableBusinessFeatures);

  const service: TTSServer = enableBusinessFeatures ? 'openai' : ttsSettings.ttsService;
  const isFishAudio = service === 'fishaudio';

  // Fish Audio's "voice" is a reference_id chosen once in settings, not per agent.
  const voice = isFishAudio ? (ttsSettings.fishAudio?.referenceId ?? '') : agentVoice;
  const apiKey = ttsSettings.fishAudio?.apiKey;

  return {
    api: {
      // Only hand the Fish key to the Fish endpoint — it must never ride along to OpenAI's.
      headers: createHeaderWithOpenAI(
        isFishAudio && apiKey ? { [FISH_AUDIO_API_KEY_HEADER_KEY]: apiKey } : undefined,
      ),
      serviceUrl: API_ENDPOINTS.tts(enableBusinessFeatures ? businessTTSProvider : service),
    },
    options: {
      model: isFishAudio ? DEFAULT_FISH_AUDIO_TTS_MODEL : ttsSettings.openAI.ttsModel,
      // `voice` is typed as OpenAI's literal union upstream; every service reads it as an
      // opaque string on the wire.
      voice,
    } as OpenAITTSOptions['options'],
    voiceIdentity: getTTSVoiceIdentity(service, voice),
  };
};
