import OpenAI from 'openai';
import { describe, expect, it } from 'vitest';

import { AgentRuntimeErrorType } from '../types/error';
import { handleOpenAIError } from './handleOpenAIError';

describe('handleOpenAIError', () => {
  describe('OpenAI APIError handling', () => {
    it('should handle OpenAI APIError with error object', () => {
      const apiError = new OpenAI.APIError(
        472,
        { error: { message: 'API error', type: 'invalid_request' } },
        'test-message',
        undefined,
      );

      const result = handleOpenAIError(apiError);

      expect(result.errorResult).toEqual({
        error: { message: 'API error', type: 'invalid_request' },
      });
      expect(result.message).toBe(apiError.message);
      expect(result.RuntimeError).toBeUndefined();
    });

    it('should handle OpenAI APIError with cause', () => {
      const cause = { message: 'Network error', code: 'ECONNRESET' };
      const apiError = new OpenAI.APIError(472, null as any, 'test-message', undefined);
      (apiError as any).cause = cause;

      const result = handleOpenAIError(apiError);

      expect(result.errorResult).toEqual(cause);
      expect(result.message).toBe(apiError.message);
      expect(result.RuntimeError).toBeUndefined();
    });

    it('should handle OpenAI APIError without error or cause', () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      const apiError = new OpenAI.APIError(472, null as any, 'test-message', headers);

      const result = handleOpenAIError(apiError);

      expect(result.errorResult).toEqual({
        headers: apiError.headers,
        status: 472,
      });
      expect(result.message).toBe(apiError.message);
      expect(result.RuntimeError).toBeUndefined();
    });

    it('should handle OpenAI APIError with both error and cause', () => {
      const errorObject = { message: 'API error', type: 'rate_limit' };
      const cause = { message: 'Rate limit exceeded' };
      const apiError = new OpenAI.APIError(472, { error: errorObject }, 'test-message', undefined);
      (apiError as any).cause = cause;

      const result = handleOpenAIError(apiError);

      // Should prioritize error over cause
      expect(result.errorResult).toEqual({ error: errorObject });
      expect(result.message).toBe(apiError.message);
    });

    it('should classify OpenAI content_filter APIError as provider content policy violation', () => {
      const apiError = new OpenAI.APIError(
        400,
        {
          error: {
            code: 'content_filter',
            message: 'The provider blocked this prompt.',
            type: 'content_filter',
          },
        },
        'content filter',
        undefined,
      );

      const result = handleOpenAIError(apiError);

      expect(result.errorResult).toEqual({
        error: {
          code: 'content_filter',
          message: 'The provider blocked this prompt.',
          type: 'content_filter',
        },
      });
      expect(result.message).toBe(apiError.message);
      expect(result.RuntimeError).toBe(AgentRuntimeErrorType.ProviderContentPolicyViolation);
    });
  });

  describe('Non-OpenAI error handling', () => {
    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      error.cause = { details: 'Error details' };

      const result = handleOpenAIError(error);

      expect(result).toEqual({
        RuntimeError: AgentRuntimeErrorType.AgentRuntimeError,
        errorResult: {
          cause: { details: 'Error details' },
          message: 'Generic error',
          name: 'Error',
        },
        message: 'Generic error',
      });
    });

    it('should handle Error without cause', () => {
      const error = new Error('Simple error');

      const result = handleOpenAIError(error);

      expect(result).toEqual({
        RuntimeError: AgentRuntimeErrorType.AgentRuntimeError,
        errorResult: {
          cause: undefined,
          message: 'Simple error',
          name: 'Error',
        },
        message: 'Simple error',
      });
    });

    it('should handle custom Error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const result = handleOpenAIError(error);

      expect(result).toEqual({
        RuntimeError: AgentRuntimeErrorType.AgentRuntimeError,
        errorResult: {
          cause: undefined,
          message: 'Custom error message',
          name: 'CustomError',
        },
        message: 'Custom error message',
      });
    });

    it('should handle non-Error objects', () => {
      const errorObject = {
        message: 'Object error',
        code: 'CUSTOM_ERROR',
      };

      const result = handleOpenAIError(errorObject);

      expect(result).toEqual({
        RuntimeError: AgentRuntimeErrorType.AgentRuntimeError,
        errorResult: {
          cause: undefined,
          message: 'Object error',
          name: undefined,
        },
        message: 'Object error',
      });
    });
  });
  describe('serializable diagnostics (fork)', () => {
    // `JSON.stringify(new Error('x'))` is `'{}'` — message/name/stack are all
    // non-enumerable. APIConnectionError parks the real failure (fetch failed,
    // terminated, connect timeout) in `cause`, so handing that Error straight
    // back as `errorResult` erases the only useful diagnostic before it reaches
    // the UI: the surfaced payload becomes a bare `{}`.
    it('keeps the underlying reason when an APIError carries an Error cause', () => {
      const cause = Object.assign(new TypeError('fetch failed'), {
        code: 'UND_ERR_CONNECT_TIMEOUT',
      });
      const connectionError = new OpenAI.APIConnectionError({ cause });

      const result = handleOpenAIError(connectionError);

      // The assertion must run on the SERIALIZED payload: that is what the UI
      // receives, and it is where a bare Error collapses into `{}`.
      const serialized = JSON.stringify(result.errorResult);
      expect(serialized).toContain('fetch failed');
      expect(serialized).toContain('UND_ERR_CONNECT_TIMEOUT');
    });

    it('keeps the underlying reason when an APIError carries an Error in `error`', () => {
      const apiError = new OpenAI.APIError(500, null as any, 'boom', undefined);
      (apiError as any).error = new Error('relay exploded');

      const result = handleOpenAIError(apiError);

      expect(JSON.stringify(result.errorResult)).toContain('relay exploded');
    });

    it('unwraps a nested Error cause on a plain Error', () => {
      const err = new Error('outer');
      (err as any).cause = new Error('inner reason');

      const result = handleOpenAIError(err);

      expect(JSON.stringify(result.errorResult)).toContain('inner reason');
    });

    // Plain-object causes and standard error bodies must survive untouched.
    it('leaves non-Error results unchanged', () => {
      const cause = { code: 'ECONNRESET', message: 'Network error' };
      const apiError = new OpenAI.APIError(472, null as any, 'test-message', undefined);
      (apiError as any).cause = cause;

      expect(handleOpenAIError(apiError).errorResult).toEqual(cause);
    });
  });
});
