'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { useConversationStore } from '@/features/Conversation';
import {
  SHARE_TEXT_PARAM,
  SHARE_TITLE_PARAM,
  SHARE_URL_PARAM,
} from '@/libs/metadata/pwaCapabilities';

import { composeSharedText } from './composeSharedText';

/**
 * Renders nothing — consumes a Web Share Target payload into the composer.
 *
 * Deliberately drops the shared text into the input **without sending it**,
 * unlike the sibling `MessageFromUrl` (which auto-sends `?message=`). Content
 * arriving from the OS share sheet is raw — a page title glued to a link, a
 * half-selected paragraph — and almost always needs a question added before it
 * is worth sending. Auto-sending it would burn a turn on "here is a link".
 *
 * Must live inside ConversationProvider, next to the other composer consumers.
 */
const SharedTextFromUrl = () => {
  const editor = useConversationStore((s) => s.editor);
  const updateInputMessage = useConversationStore((s) => s.updateInputMessage);
  const [searchParams, setSearchParams] = useSearchParams();

  // A share is a one-shot event: once applied, never re-apply it for this mount
  // even if the effect re-runs before the params are cleared from the URL.
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;

    const shared = composeSharedText({
      text: searchParams.get(SHARE_TEXT_PARAM),
      title: searchParams.get(SHARE_TITLE_PARAM),
      url: searchParams.get(SHARE_URL_PARAM),
    });
    if (!shared) return;

    // The share lands on a cold start, so the editor is usually not mounted on
    // the first pass. Hold the params until it is rather than dropping them.
    if (!editor) return;

    appliedRef.current = true;

    // setDocument alone does not fire the change handler that keeps
    // inputMessage in sync — Send would stay disabled (see ComposerDraftReceiver).
    editor.setDocument('markdown', shared);
    updateInputMessage(shared);
    editor.focus();

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(SHARE_TEXT_PARAM);
        next.delete(SHARE_TITLE_PARAM);
        next.delete(SHARE_URL_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, editor, updateInputMessage]);

  return null;
};

export default SharedTextFromUrl;
