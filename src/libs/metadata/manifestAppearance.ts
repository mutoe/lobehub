import { cookies } from 'next/headers';

import { LOBE_THEME_APPEARANCE_COOKIE } from '@/features/PWA/appearanceCookie';
import { BOOT_PALETTE, clampThemeColor } from '@/features/PWA/themeColor';

export interface ManifestColors {
  /** Splash screen background: the color the page actually paints. */
  backgroundColor: string;
  /** `theme_color`: status bar at launch and the Android navigation bar. */
  color: string;
}

/**
 * Fork-only: pick the manifest colors for the appearance the app last reported
 * (see `appearanceCookie.ts`). Anything but an explicit "dark" is treated as
 * light — that is what a fresh install shows, and the status bar corrects
 * itself at runtime either way.
 */
export const pickManifestColors = (cookieAppearance: string | null | undefined): ManifestColors => {
  const background = cookieAppearance === 'dark' ? BOOT_PALETTE.dark : BOOT_PALETTE.light;

  return { backgroundColor: background, color: clampThemeColor(background) };
};

export const resolveManifestAppearance = async (): Promise<ManifestColors> => {
  const cookieStore = await cookies();

  return pickManifestColors(cookieStore.get(LOBE_THEME_APPEARANCE_COOKIE)?.value);
};
