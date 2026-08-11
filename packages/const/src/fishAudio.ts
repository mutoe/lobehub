/**
 * Fork: constants shared by the Fish Audio text-to-speech client and server halves.
 *
 * Fish Audio is deliberately *not* OpenAI-compatible: the request body is
 * `{text, reference_id, format}` and the model is selected through a request header
 * rather than the body. The translation from LobeHub's OpenAI-shaped TTS payload lives
 * in `@/server/utils/fishAudioSpeech`; only the wire constants both sides need are here.
 *
 * Kept in its own file (rather than appended to `fetch.ts` or the barrel) so upstream
 * rebases never conflict with it.
 */

export const FISH_AUDIO_BASE_URL = 'https://api.fish.audio';

/**
 * Carries the user-configured key from the browser to `/webapi/tts/fishaudio`, mirroring
 * how `X-openai-api-key` reaches `/webapi/tts/openai`. Only attached when the request is
 * actually bound for Fish Audio.
 */
export const FISH_AUDIO_API_KEY_HEADER_KEY = 'X-fishaudio-api-key';

/**
 * The free S2.1 Pro tier is opt-in **per request**: omit this header and Fish Audio falls
 * back to a paid model, answering `402 Insufficient API credit` on an account that has no
 * balance. So it is mandatory, not a nicety.
 *
 * @see https://fish.audio/zh-CN/blog/s2-1-pro-free-api/
 */
export const DEFAULT_FISH_AUDIO_TTS_MODEL = 's2.1-pro-free';

/**
 * Fish Audio validates `reference_id` as `1..=128` chars of `[A-Za-z0-9_-]`, so an empty
 * string is a `400` — the field has to be omitted entirely to get the stock voice.
 */
export const isValidFishAudioReferenceId = (value?: string | null): value is string =>
  !!value && /^[\w-]{1,128}$/.test(value);
