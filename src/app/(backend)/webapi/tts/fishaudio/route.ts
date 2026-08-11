import { AgentRuntimeErrorType } from '@lobechat/model-runtime/types/error';

import { FISH_AUDIO_API_KEY_HEADER_KEY } from '@/const/fishAudio';
import { createSpeechResponse } from '@/server/utils/createSpeechResponse';
import { createFishAudioSpeech, type FishAudioSpeechPayload } from '@/server/utils/fishAudioSpeech';
import { createErrorResponse } from '@/utils/errorResponse';

export const POST = async (req: Request) => {
  const payload = (await req.json()) as FishAudioSpeechPayload;

  // Settings first, deployment env as the fallback: a self-hosted instance can ship one
  // shared key through FISH_AUDIO_API_KEY while individual users still bring their own.
  const apiKey = req.headers.get(FISH_AUDIO_API_KEY_HEADER_KEY) || process.env.FISH_AUDIO_API_KEY;

  if (!apiKey)
    return createErrorResponse(AgentRuntimeErrorType.InvalidProviderAPIKey, {
      provider: 'fishaudio',
    });

  return createSpeechResponse(() => createFishAudioSpeech({ apiKey, payload }), {
    logTag: 'webapi/tts/fishaudio',
    messages: {
      failure: 'Failed to synthesize speech with Fish Audio',
      invalid: 'Unexpected payload from Fish Audio TTS',
    },
  });
};
