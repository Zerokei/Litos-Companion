import { describe, expect, it } from 'vitest';
import { ZenMode } from '../src/features/zen';
import { normalizeSettings, SettingsStore } from '../src/settings/model';

describe('Zen mode', () => {
  it('defaults off for existing data and persists only boolean preferences', async () => {
    expect(normalizeSettings({ zenMode: 'true' }).zenMode).toBe(false);
    const writes: unknown[] = [];
    const store = new SettingsStore({}, async value => { writes.push(value); });
    await store.update({ zenMode: true });
    expect(normalizeSettings(writes[0]).zenMode).toBe(true);
  });
  it('updates multiple documents and cleans removed windows and disposal', () => {
    const mode = new ZenMode();
    const other = document.implementation.createHTMLDocument();
    document.body.classList.add('unrelated');
    mode.update([document, other], true);
    expect(other.body.classList.contains('litos-companion-zen')).toBe(true);
    mode.update([document], true);
    expect(other.body.classList.contains('litos-companion-zen')).toBe(false);
    mode.update([document], false);
    expect(document.body.classList.contains('litos-companion-zen')).toBe(false);
    mode.update([document], true);
    mode.dispose();
    expect(document.body.classList.contains('litos-companion-zen')).toBe(false);
    expect(document.body.classList.contains('unrelated')).toBe(true);
    document.body.classList.remove('unrelated');
  });
});
