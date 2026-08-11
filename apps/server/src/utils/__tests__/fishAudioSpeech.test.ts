import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFishAudioSpeech } from '../fishAudioSpeech';

const BASE_URL = 'https://fish.test';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

const audioResponse = () =>
  new Response(new Uint8Array([1, 2, 3]), {
    headers: { 'content-type': 'audio/mpeg' },
    status: 200,
  });

const errorResponse = (status: number, body: string) =>
  new Response(body, { headers: { 'content-type': 'application/json' }, status });

/** Run the speech call and hand back the request Fish Audio would have received. */
const callAndCaptureRequest = async (
  payload: Parameters<typeof createFishAudioSpeech>[0]['payload'],
) => {
  fetchMock.mockResolvedValue(audioResponse());

  await createFishAudioSpeech({ apiKey: 'sk-fish-test', baseURL: BASE_URL, payload });

  const [url, init] = fetchMock.mock.calls[0];

  return { body: JSON.parse(init.body), headers: init.headers, url };
};

describe('createFishAudioSpeech', () => {
  it('targets the Fish Audio speech endpoint with the bearer key', async () => {
    const { url, headers } = await callAndCaptureRequest({ input: 'hello' });

    expect(url).toBe('https://fish.test/v1/tts');
    expect(headers.Authorization).toBe('Bearer sk-fish-test');
  });

  // Regression: the free tier is opt-in per request. Without this header Fish Audio falls
  // back to a paid model and answers `402 Insufficient API credit`.
  it('always sends the free-tier model header', async () => {
    const { headers } = await callAndCaptureRequest({ input: 'hello' });

    expect(headers.model).toBe('s2.1-pro-free');
  });

  it('lets an explicit model override the default', async () => {
    const { headers } = await callAndCaptureRequest({
      input: 'hello',
      options: { model: 'speech-1.6' },
    });

    expect(headers.model).toBe('speech-1.6');
  });

  // Regression: `reference_id: ''` is a 400 ("must be 1..=128 chars"), so the key has to be
  // absent — not blank — for the stock voice.
  it.each([
    ['no options', undefined],
    ['an empty voice', { voice: '' }],
    ['a whitespace-only voice', { voice: '   ' }],
  ])('omits reference_id entirely given %s', async (_label, options) => {
    const { body } = await callAndCaptureRequest({ input: 'hello', options });

    expect(body).toEqual({ format: 'mp3', text: 'hello' });
    expect('reference_id' in body).toBe(false);
  });

  it('sends the trimmed voice as reference_id', async () => {
    const { body } = await callAndCaptureRequest({
      input: 'hello',
      options: { voice: ' 7cc066528f1a4cfb97de0190fb0c025f ' },
    });

    expect(body).toEqual({
      format: 'mp3',
      reference_id: '7cc066528f1a4cfb97de0190fb0c025f',
      text: 'hello',
    });
  });

  it('returns the audio response untouched on success', async () => {
    const response = audioResponse();
    fetchMock.mockResolvedValue(response);

    await expect(
      createFishAudioSpeech({ apiKey: 'k', baseURL: BASE_URL, payload: { input: 'hi' } }),
    ).resolves.toBe(response);
  });

  describe('upstream failures', () => {
    const rejectionOf = async (status: number, body: string) => {
      fetchMock.mockResolvedValue(errorResponse(status, body));

      const thrown = await createFishAudioSpeech({
        apiKey: 'k',
        baseURL: BASE_URL,
        payload: { input: 'hi' },
      }).catch((error) => error as Response);

      return { json: await thrown.json(), response: thrown };
    };

    // Regression: Fish Audio replies with a flat `{message, status}` and no `error` wrapper.
    // Passing that through leaves the client without an errorType, and the player titles the
    // alert with the literal key `response.undefined`.
    it('re-wraps a bad key as InvalidProviderAPIKey', async () => {
      const { json, response } = await rejectionOf(401, '{"status":401,"message":"Invalid Token"}');

      expect(response.status).toBe(401);
      expect(json.errorType).toBe('InvalidProviderAPIKey');
      expect(json.body).toEqual({
        error: { message: 'Invalid Token', status: 401 },
        provider: 'fishaudio',
      });
    });

    it('re-wraps every other upstream failure as ProviderBizError, keeping the reason', async () => {
      const { json } = await rejectionOf(
        402,
        '{"status":402,"message":"Insufficient API credit."}',
      );

      expect(json.errorType).toBe('ProviderBizError');
      expect(json.body.error.message).toBe('Insufficient API credit.');
    });

    it('keeps a non-JSON error body as raw text instead of throwing', async () => {
      const { json } = await rejectionOf(502, '<html>bad gateway</html>');

      expect(json.errorType).toBe('ProviderBizError');
      expect(json.body.error).toBe('<html>bad gateway</html>');
    });
  });
});
