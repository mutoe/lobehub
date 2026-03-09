/**
 * Maps locale codes (e.g. zh-CN, en-US) to a clear language name for LLM prompts,
 * so extraction output follows the user's response language setting.
 * When the locale is not mapped, returns the input as-is so models can still interpret it.
 */
const LOCALE_TO_OUTPUT_LANGUAGE: Record<string, string> = {
  'ar': 'Arabic',
  'bg-BG': 'Bulgarian',
  'de-DE': 'German',
  'en-US': 'English',
  'es-ES': 'Spanish',
  'fa-IR': 'Persian',
  'fr-FR': 'French',
  'it-IT': 'Italian',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'nl-NL': 'Dutch',
  'pl-PL': 'Polish',
  'pt-BR': 'Portuguese (Brazil)',
  'ru-RU': 'Russian',
  'tr-TR': 'Turkish',
  'vi-VN': 'Vietnamese',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
};

/**
 * Convert user's response locale to a language name for memory extraction prompts.
 * Ensures the model receives an explicit instruction like "Simplified Chinese" or "English"
 * instead of a raw locale code, so extracted memories follow the user's language.
 */
export function localeToOutputLanguage(locale: string | undefined): string {
  if (!locale || !locale.trim()) return 'English';

  const normalized = locale.trim();
  const mapped = LOCALE_TO_OUTPUT_LANGUAGE[normalized];

  if (mapped) return mapped;

  // Fallback: use primary part (e.g. "zh" from "zh-CN") for common cases
  const primary = normalized.split(/[-_]/)[0]?.toLowerCase();
  if (primary === 'zh')
    return normalized.startsWith('zh-Hant') || normalized === 'zh-TW'
      ? 'Traditional Chinese'
      : 'Simplified Chinese';

  return normalized;
}
