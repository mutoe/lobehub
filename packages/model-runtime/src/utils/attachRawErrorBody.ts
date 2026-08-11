import type OpenAI from 'openai';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Fork utility: keep the provider's raw error body reachable.
 *
 * The OpenAI SDK narrows an error response to its `error` key and throws the
 * rest away:
 *
 * ```js
 * // openai/core/error.js
 * static generate(status, errorResponse, message, headers) {
 *   const error = errorResponse?.['error'];        // <- only this survives
 *   if (status === 400) return new BadRequestError(status, error, message, headers);
 * }
 * ```
 *
 * That is fine for OpenAI itself, which always answers `{"error": {...}}`. Many
 * OpenAI-compatible relays don't — a flat `{"message": "..."}` is common. For
 * those, `err.error` is `undefined`, `makeMessage` finds nothing to print and
 * produces the notoriously unhelpful `400 status code (no body)` even though the
 * response carried a perfectly good explanation (observed: a 475-byte body whose
 * text never reached the UI).
 *
 * `makeStatusError` is the single client-level seam that still sees the parsed
 * body, so wrap it and normalize the non-standard shape into the one every
 * downstream consumer already reads — `handleOpenAIError` picks up `err.error`
 * unchanged, and the message stops lying about there being no body.
 *
 * Purely additive: responses that do use `{"error": {...}}` are left untouched.
 */
export const attachRawErrorBody = <T extends OpenAI>(client: T): T => {
  const target = client as unknown as {
    makeStatusError?: (status: number, error: unknown, message: unknown, headers: unknown) => any;
  };
  const original = target.makeStatusError;

  if (typeof original !== 'function') return client;

  target.makeStatusError = function patchedMakeStatusError(status, errJSON, errMessage, headers) {
    const error = original.call(this, status, errJSON, errMessage, headers);

    // Standard shape (or nothing to salvage) — leave the SDK's result alone.
    if (!isRecord(errJSON) || isRecord(errJSON.error) || !error) return error;

    try {
      if (error.error === undefined) error.error = errJSON;

      // Mirror APIError.makeMessage for the flat shape, so the surfaced string is
      // `400 <reason>` instead of `400 status code (no body)`.
      const reason =
        typeof errJSON.message === 'string' && errJSON.message
          ? errJSON.message
          : JSON.stringify(errJSON);

      if (status && reason) error.message = `${status} ${reason}`;
    } catch {
      // Never let diagnostics enrichment mask the original failure.
    }

    return error;
  };

  return client;
};
