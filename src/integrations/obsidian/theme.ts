import type { App } from 'obsidian';
import type { InstalledTheme } from '../../theme/compatibility';

/** Read only the selected theme's metadata through the public vault adapter. */
export async function readInstalledTheme(app: App): Promise<InstalledTheme | null> {
  try {
    const configDir = app.vault.configDir;
    const appearance: unknown = JSON.parse(await app.vault.adapter.read(`${configDir}/appearance.json`));
    if (!appearance || typeof appearance !== 'object' || !('cssTheme' in appearance)) return null;
    const folder = appearance.cssTheme;
    if (typeof folder !== 'string' || !folder || /[\\/]/.test(folder) || folder === '.' || folder === '..') return null;
    const manifest: unknown = JSON.parse(await app.vault.adapter.read(`${configDir}/themes/${folder}/manifest.json`));
    if (!manifest || typeof manifest !== 'object' || !('name' in manifest) || !('version' in manifest)) return null;
    return typeof manifest.name === 'string' && typeof manifest.version === 'string'
      ? { name: manifest.name, version: manifest.version } : null;
  } catch { return null; }
}
