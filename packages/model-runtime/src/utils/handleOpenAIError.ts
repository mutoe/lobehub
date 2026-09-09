import OpenAI from 'openai';

import type { ILobeAgentRuntimeErrorType } from '../types/error';
import { AgentRuntimeErrorType } from '../types/error';
import { isErrorCausedByContentFilter } from './isErrorCausedByContentFilter';

/**
 * Fork: `JSON.stringify(new Error('boom'))` is `'{}'` — `message`, `name` and
 * `stack` are all non-enumerable, so an Error handed to the UI arrives as an
 * empty object with its diagnostic erased.
 *
 * The SDK parks the real failure in `cause`: `APIConnectionError` wraps
 * `fetch failed` / `terminated` / connect timeouts that way. Passing that value
 * through verbatim is what turns a plain relay timeout into the unactionable
 * `"error": {}` seen in the UI — indistinguishable from an auth failure.
 *
 * Flatten Errors into plain objects so the reason survives serialization. Own
 * enumerable properties (undici's `code`, for instance) are preserved, nested
 * causes are unwrapped, and non-Error values are returned untouched.
 */
const toSerializableError = (value: unknown, depth = 0): unknown => {
  if (!(value instanceof Error)) return value;
  if (depth >= 3) return { message: value.message, name: value.name };

  const { cause, ...ownEnumerable } = value as Error & Record<string, unknown>;

  return {
    ...ownEnumerable,
    message: value.message,
    name: value.name,
    ...(cause === undefined ? {} : { cause: toSerializableError(cause, depth + 1) }),
  };
};

export const handleOpenAIError = (
  error: any,
): { RuntimeError?: ILobeAgentRuntimeErrorType; errorResult: any; message?: string } => {
  let errorResult: any;

  // Check if the error is an OpenAI APIError
  if (error instanceof OpenAI.APIError) {
    // if error is definitely OpenAI APIError, there will be an error object
    if (error.error) {
      errorResult = toSerializableError(error.error);
    }
    // Or if there is a cause, we use error cause
    // This often happened when there is a bug of the `openai` package.
    else if (error.cause) {
      errorResult = toSerializableError(error.cause);
    }
    // if there is no other request error, the error object is a Response like object
    else {
      errorResult = { headers: error.headers, status: error.status };
    }

    return {
      errorResult,
      message: error.message,
      RuntimeError: isErrorCausedByContentFilter(errorResult)
        ? AgentRuntimeErrorType.ProviderContentPolicyViolation
        : undefined,
    };
  } else {
    const err = error as Error;

    errorResult = { cause: toSerializableError(err.cause), message: err.message, name: err.name };

    return {
      RuntimeError: AgentRuntimeErrorType.AgentRuntimeError,
      errorResult,
      message: err.message,
    };
  }
};
