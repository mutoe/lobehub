interface SharedPayload {
  text?: string | null;
  title?: string | null;
  url?: string | null;
}

/**
 * Flatten a Web Share Target payload into the single markdown string the
 * composer takes.
 *
 * The three fields overlap heavily in practice — Android hands the same link in
 * both `text` and `url` when sharing from a browser, and `title` is often just
 * the text again when sharing a selection. Concatenating blindly produces the
 * link twice, so each part is only kept when it adds something.
 */
export const composeSharedText = ({ text, title, url }: SharedPayload): string => {
  const trimmedText = text?.trim() || '';
  const trimmedTitle = title?.trim() || '';
  const trimmedUrl = url?.trim() || '';

  const parts: string[] = [];

  if (trimmedTitle && trimmedTitle !== trimmedText) parts.push(trimmedTitle);
  if (trimmedText) parts.push(trimmedText);
  if (trimmedUrl && !trimmedText.includes(trimmedUrl)) parts.push(trimmedUrl);

  return parts.join('\n\n');
};
