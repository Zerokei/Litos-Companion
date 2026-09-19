import type { App } from 'obsidian';

/** Internal APIs used by Obsidian's own Appearance tab (verified on 1.13.7). */
type AccentHost = {
  getAccentColor?: () => unknown;
  vault?: {
    getConfig?: (key: string) => unknown;
    setConfig?: (key: string, value: string) => void;
  };
};
export function readAccent(app: App): { color: string; custom: boolean } | null {
  const host = app as AccentHost;
  if (typeof host.getAccentColor !== 'function' || typeof host.vault?.getConfig !== 'function' ||
      typeof host.vault.setConfig !== 'function') return null;
  try {
    const color = host.getAccentColor();
    if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) return null;
    return { color, custom: !!host.vault.getConfig('accentColor') };
  } catch { return null; }
}
export function writeAccent(app: App, color: string): boolean {
  if (color !== '' && !/^#[\da-f]{6}$/i.test(color)) return false;
  if (!readAccent(app)) return false;
  try {
    (app as AccentHost).vault?.setConfig?.('accentColor', color);
    return true;
  } catch { return false; }
}
