import OpenAI from 'openai';
import { describe, expect, it } from 'vitest';

import { attachRawErrorBody } from './attachRawErrorBody';

const makeHeaders = () => new Headers();

/** Reach the protected seam the SDK uses to build errors from a response body. */
const makeError = (client: OpenAI, status: number, body: unknown) =>
  (client as any).makeStatusError(status, body, undefined, makeHeaders());

describe('attachRawErrorBody', () => {
  const createClient = () =>
    attachRawErrorBody(
      new OpenAI({
        apiKey: 'test',
        baseURL: 'https://relay.example.com/v1',
        dangerouslyAllowBrowser: true,
      }),
    );

  // Regression: relays commonly answer a flat `{"message": "..."}`. The SDK only
  // keeps `body.error`, so the explanation was dropped and the surfaced string
  // became `400 status code (no body)` — with a 475-byte body on the wire.
  it('promotes a flat error body so the reason survives', () => {
    const error = makeError(createClient(), 400, {
      message: '模型底层内容审查不通过，请修改后重试',
    });

    expect(error.error).toEqual({ message: '模型底层内容审查不通过，请修改后重试' });
    expect(error.message).toBe('400 模型底层内容审查不通过，请修改后重试');
    expect(error.message).not.toContain('no body');
  });

  it('leaves standard OpenAI error envelopes untouched', () => {
    const body = { error: { code: 'invalid_api_key', message: 'Incorrect API key provided' } };
    const error = makeError(createClient(), 401, body);

    expect(error.error).toEqual(body.error);
    expect(error.message).toContain('Incorrect API key provided');
  });

  it('serializes a bodied error that carries no message field', () => {
    const error = makeError(createClient(), 400, { detail: 'channel exhausted' });

    expect(error.error).toEqual({ detail: 'channel exhausted' });
    expect(error.message).toBe('400 {"detail":"channel exhausted"}');
  });

  it('keeps the SDK behaviour when there is genuinely no body', () => {
    const error = makeError(createClient(), 500, undefined);

    expect(error.error).toBeUndefined();
    expect(error.message).toContain('500');
  });

  it('is safe to apply to a client whose seam is missing', () => {
    const bare = {} as OpenAI;

    expect(() => attachRawErrorBody(bare)).not.toThrow();
    expect(attachRawErrorBody(bare)).toBe(bare);
  });
});
