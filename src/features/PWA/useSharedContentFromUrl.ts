import debug from 'debug';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { useConversationStore } from '@/features/Conversation';
import { contextSelectors } from '@/features/Conversation/store';
import { useFileStore } from '@/store/file';

import { composeSharedText } from './composeSharedText';
import {
  SHARE_FILES_PARAM,
  SHARE_TEXT_PARAM,
  SHARE_TITLE_PARAM,
  SHARE_URL_PARAM,
} from './shareTarget/constants';
import { readSharedFiles } from './shareTarget/readSharedFiles';

const log = debug('lobe-pwa:share');

const SHARE_PARAMS = [SHARE_TEXT_PARAM, SHARE_TITLE_PARAM, SHARE_URL_PARAM, SHARE_FILES_PARAM];

/**
 * Consumes a Web Share Target payload into the composer.
 *
 * Deliberately drops the shared text into the input **without sending it**,
 * unlike the sibling `MessageFromUrl` (which auto-sends `?message=`). Content
 * arriving from the OS share sheet is raw — a page title glued to a link, a
 * half-selected paragraph — and almost always needs a question added before it
 * is worth sending. Auto-sending it would burn a turn on "here is a link".
 *
 * Shared files follow the same rule: they are attached through the ordinary
 * upload path, the one a gallery pick uses, and wait for the user to hit Send.
 *
 * Must run inside ConversationProvider, next to the other composer consumers.
 */
export const useSharedContentFromUrl = () => {
  const editor = useConversationStore((s) => s.editor);
  const updateInputMessage = useConversationStore((s) => s.updateInputMessage);
  const agentId = useConversationStore(contextSelectors.agentId);
  const uploadChatFiles = useFileStore((s) => s.uploadChatFiles);
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
    const batchId = searchParams.get(SHARE_FILES_PARAM);
    if (!shared && !batchId) return;

    // The share lands on a cold start, so the editor is usually not mounted on
    // the first pass. Hold the params until it is rather than dropping them.
    if (!editor) return;

    appliedRef.current = true;

    if (shared) {
      // setDocument alone does not fire the change handler that keeps
      // inputMessage in sync — Send would stay disabled (see ComposerDraftReceiver).
      editor.setDocument('markdown', shared);
      updateInputMessage(shared);
    }
    editor.focus();

    if (batchId) {
      // The service worker parked the files under this batch; from here on
      // they are indistinguishable from a gallery pick.
      readSharedFiles(batchId)
        .then((files) => {
          if (files.length === 0) return;
          log('attaching %d shared file(s) to agent %s', files.length, agentId);
          return uploadChatFiles(files, agentId);
        })
        .catch((error) => log('shared files dropped: %o', error));
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const param of SHARE_PARAMS) next.delete(param);
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, editor, updateInputMessage, agentId, uploadChatFiles]);
};
