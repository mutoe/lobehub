import { Button } from '@lobehub/ui/base-ui';
import { ZapOff } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePermission } from '@/hooks/usePermission';

import { useRetryParentMessage } from './useRetryParentMessage';

interface RetryWithoutStreamingButtonProps {
  id: string;
}

/**
 * Fork feature: retry the turn once with streaming disabled.
 *
 * Some OpenAI-compatible relays report upstream failures (content moderation,
 * quota, channel errors) correctly on the non-streaming endpoint — HTTP 451 +
 * `{"message": "..."}` — but swallow them entirely in streaming mode, answering
 * HTTP 200 with a bare `data: [DONE]` and nothing else. lobehub then sees a
 * syntactically valid but completely empty stream and can only report
 * `ModelEmptyCompletion`, with no way to say why. Re-running the same request
 * without streaming routes it through the endpoint that does report a reason.
 *
 * Shown next to the standard regenerate action so the provider diagnostics
 * (cost, finishReason, token counts) stay visible — this only adds an option.
 *
 * The retry is user-initiated on purpose: upstream marks empty completions
 * non-retryable because a retry is a new, potentially billable request (see
 * `model-runtime/src/errors/specs.ts`), and that call stays with the user.
 *
 * The override rides `executeClientAgent({ chatConfigOverride })` and applies to
 * this run only — the user's own "streaming output" setting is never touched.
 */
const RetryWithoutStreamingButton = memo<RetryWithoutStreamingButtonProps>(({ id }) => {
  const { t } = useTranslation('error');
  const { allowed: canCreate } = usePermission('create_content');
  const { disabled, loading, retryParentMessage } = useRetryParentMessage(id);

  const handleRetryWithoutStreaming = useCallback(async () => {
    if (!canCreate) return;

    await retryParentMessage(undefined, { chatConfigOverride: { enableStreaming: false } });
  }, [canCreate, retryParentMessage]);

  return (
    <Button
      disabled={!canCreate || disabled}
      icon={<ZapOff size={14} />}
      loading={loading}
      size="small"
      type="fill"
      onClick={handleRetryWithoutStreaming}
    >
      {t('emptyCompletion.retryWithoutStreaming')}
    </Button>
  );
});

export default RetryWithoutStreamingButton;
