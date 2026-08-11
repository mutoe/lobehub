import { AgentRuntimeErrorType } from '@lobechat/model-runtime/types/error';

import { DEFAULT_FISH_AUDIO_TTS_MODEL, FISH_AUDIO_BASE_URL } from '@/const/fishAudio';
import { createErrorResponse } from '@/utils/errorResponse';

/**
 * The payload LobeHub's TTS client sends to every `/webapi/tts/*` route.
 *
 * It is OpenAI-shaped because `@lobehub/tts` forwards `{input, options}` verbatim once a
 * `serviceUrl` is configured — see `OpenAITTS.fetch`. Declaring the shape locally keeps
 * `apps/server` free of a dependency on the client-side TTS package.
 */
export interface FishAudioSpeechPayload {
  /** One text segment. Long content is already split by the client before it gets here. */
  input: string;
  options?: {
    model?: string;
    /** Fish Audio voice model id (`reference_id`). Empty means "use the stock voice". */
    voice?: string;
  };
}

export interface CreateFishAudioSpeechOptions {
  apiKey: string;
  /** Overridable for tests. */
  baseURL?: string;
  payload: FishAudioSpeechPayload;
}

/**
 * Re-emit a failed Fish Audio response in LobeHub's `{errorType, body}` envelope.
 *
 * Fish Audio answers a flat `{"message": "...", "status": 401}` with no `error` wrapper.
 * Passing that through untouched would leave the client's `getMessageError()` without an
 * `errorType`, and the player would title the alert with the literal key
 * `response.undefined` while dropping the explanation entirely.
 */
const toLobeErrorResponse = async (response: Response) => {
  const raw = await response.text();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    body = raw;
  }

  // A bad key gets its own type so the UI can say "the key is wrong" instead of blaming
  // the provider; everything else (402 out of credit, 400 unknown reference_id, 5xx) is a
  // genuine upstream failure.
  const errorType =
    response.status === 401
      ? AgentRuntimeErrorType.InvalidProviderAPIKey
      : AgentRuntimeErrorType.ProviderBizError;

  return createErrorResponse(errorType, { error: body, provider: 'fishaudio' });
};

/**
 * Fork: translate a LobeHub TTS payload into a Fish Audio speech request.
 *
 * @see https://fish.audio/zh-CN/blog/s2-1-pro-free-api/
 */
export const createFishAudioSpeech = async ({
  apiKey,
  baseURL = FISH_AUDIO_BASE_URL,
  payload,
}: CreateFishAudioSpeechOptions): Promise<Response> => {
  const { input, options } = payload;
  const referenceId = options?.voice?.trim();

  const response = await fetch(`${baseURL}/v1/tts`, {
    body: JSON.stringify({
      format: 'mp3',
      // `reference_id: ''` is rejected with a 400 ("must be 1..=128 chars"), so the key has
      // to be omitted entirely — not blanked — to fall back to the stock voice.
      ...(referenceId ? { reference_id: referenceId } : {}),
      text: input,
    }),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Deliberately a header, not a body field: that is Fish Audio's own convention, and
      // dropping it silently downgrades the request to a paid model that answers
      // `402 Insufficient API credit`.
      'model': options?.model || DEFAULT_FISH_AUDIO_TTS_MODEL,
    },
    method: 'POST',
  });

  // Throw rather than return so `createNodeResponse` routes this through its error branch.
  // Returning it would let the success branch stamp `audio/mpeg` onto a JSON error body,
  // and the player would try to decode the explanation as sound.
  if (!response.ok) throw await toLobeErrorResponse(response);

  return response;
};
