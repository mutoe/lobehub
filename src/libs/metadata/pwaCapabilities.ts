import {
  SHARE_FILES_FIELD,
  SHARE_TARGET_ACTION,
  SHARE_TEXT_PARAM,
  SHARE_TITLE_PARAM,
  SHARE_URL_PARAM,
} from '@/features/PWA/shareTarget/constants';
import { type Locales } from '@/locales/resources';

/**
 * Fork-only PWA manifest members that make the installed web app behave like a
 * native one: it appears in the OS share sheet, and its launcher icon carries
 * long-press shortcuts.
 *
 * Kept out of `manifest.ts` (an upstream file) so upstream rebases only ever
 * touch the single spread that pulls these in.
 */

export { SHARE_TEXT_PARAM, SHARE_TITLE_PARAM, SHARE_URL_PARAM };

/**
 * Web Share Target.
 *
 * `POST` + multipart is what lets the OS hand us files. The trade-off is that a
 * POST navigation is only ever seen by the service worker (`features/PWA/sw`),
 * which parks the files and redirects to a plain GET carrying the text params
 * and a batch id — so the SPA side still reads everything from the URL.
 *
 * Text-only shares travel the same road; there is only one target per app.
 */
export const shareTarget = {
  action: SHARE_TARGET_ACTION,
  enctype: 'multipart/form-data',
  method: 'POST',
  params: {
    files: [{ accept: ['image/*'], name: SHARE_FILES_FIELD }],
    text: SHARE_TEXT_PARAM,
    title: SHARE_TITLE_PARAM,
    url: SHARE_URL_PARAM,
  },
} as const;

/**
 * Reuses the 192px launcher icon. The spec asks for ≥96px; without an icon
 * Android launchers fall back to a generic glyph next to each shortcut.
 */
const SHORTCUT_ICONS = [
  { sizes: '192x192', src: '/app-icons/icon-192x192.png', type: 'image/png' },
] as const;

type ShortcutKey = 'chat' | 'image' | 'tasks';

/**
 * Hand-maintained rather than an i18n namespace: the manifest is one JSON
 * document with no runtime translation, and adding keys to the locale files
 * would put them in the path of upstream's daily auto-translation commits.
 * Two languages is the whole audience of this fork.
 */
const SHORTCUT_LABELS: Record<'en-US' | 'zh-CN', Record<ShortcutKey, [string, string]>> = {
  'en-US': {
    chat: ['New Chat', 'Chat'],
    image: ['Image Generation', 'Image'],
    tasks: ['Tasks', 'Tasks'],
  },
  'zh-CN': {
    chat: ['新对话', '对话'],
    image: ['图片生成', '图片'],
    tasks: ['任务', '任务'],
  },
};

const SHORTCUT_URLS: Record<ShortcutKey, string> = {
  chat: SHARE_TARGET_ACTION,
  image: '/image',
  tasks: '/tasks',
};

/**
 * Launcher shortcuts (long-press the icon on Android, right-click in a desktop
 * dock). Keep the list short — Android surfaces at most 4 and drops the rest
 * silently.
 */
export const getShortcuts = (locale: Locales | string) => {
  const labels =
    SHORTCUT_LABELS[locale as keyof typeof SHORTCUT_LABELS] ?? SHORTCUT_LABELS['en-US'];

  return (Object.keys(SHORTCUT_URLS) as ShortcutKey[]).map((key) => ({
    icons: SHORTCUT_ICONS,
    name: labels[key][0],
    short_name: labels[key][1],
    url: SHORTCUT_URLS[key],
  }));
};
