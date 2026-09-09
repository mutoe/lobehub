/**
 * Fork utility: make Responses API input palatable to third-party relays.
 *
 * The Responses API renamed the system turn to `developer`, and
 * `convertOpenAIResponseInputs` rewrites every `system` message accordingly:
 *
 * ```ts
 * // core/contextBuilders/openai.ts
 * if (message.role === 'system') {
 *   items.push({ ...message, role: 'developer' } as ResponseInputItem);
 * }
 * ```
 *
 * That is correct against OpenAI's own endpoint. Relays are a different story —
 * many implement `/v1/responses` just far enough to serve plain user turns.
 *
 * Observed against geekai.co (2026-09-10): an input carrying a `developer` item
 * comes back **HTTP 200 with a completely empty body** — no events, no error,
 * not even a status code to act on. LobeHub surfaces that as the unactionable
 * "请求返回为空", and every request carries one, because the system prompt
 * (current date, media capabilities, agent context) is always present.
 *
 * Measured, alternating 25s apart to rule out rate limiting:
 *
 * ```text
 * role=user       deltas=18 / 14 / 14 / 18 / 14
 * role=developer  deltas=0  / 0  / 0
 * role=system     deltas=0  / 0  / 0
 * ```
 *
 * So `system` is no escape hatch on that relay either — only `user` survives.
 * Upstream already reaches for exactly this fallback when a model cannot take a
 * system turn (`systemToUserModels` in `core/contextBuilders/openai.ts` and
 * `providers/azureai`), so downgrading to `user` follows an established pattern
 * rather than inventing one.
 *
 * The prompt keeps its content and position; only the role label changes, which
 * costs some instruction priority but is the difference between a working
 * request and an empty one. Applied only on a custom `baseURL` — talking to the
 * provider's own endpoint is left strictly to spec.
 */
export const downgradeDeveloperRoleForRelay = <T>(input: T): T => {
  if (!Array.isArray(input)) return input;

  let changed = false;

  const items = input.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    if ((item as { role?: unknown }).role !== 'developer') return item;

    changed = true;
    return { ...(item as Record<string, unknown>), role: 'user' };
  });

  // Preserve referential identity when there is nothing to rewrite.
  return (changed ? items : input) as T;
};
