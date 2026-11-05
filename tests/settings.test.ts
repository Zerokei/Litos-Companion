import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings, SettingsStore } from '../src/settings/model';
describe('settings', () => {
  it('allows diagrams to request ELK when the preference is missing or invalid', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ headingAlignment: 'left' }).diagramsEnabled).toBe(true);
    expect(normalizeSettings({ version: 2, headingAlignment: 'center', diagramsEnabled: 'true' })).toEqual(DEFAULT_SETTINGS);
  });
  it.each([true, false])('migrates v1 automatic enhancement (%s) to per-diagram selection', diagramsEnabled => {
    expect(normalizeSettings({ version: 1, headingAlignment: 'left', diagramsEnabled, zenMode: true, other: 1 }))
      .toEqual({ version: 2, headingAlignment: 'left', diagramsEnabled: true, zenMode: true });
  });
  it('preserves the new master opt-out on reload', () => {
    expect(normalizeSettings({ version: 2, diagramsEnabled: false }).diagramsEnabled).toBe(false);
  });
  it('serializes saves and recovers after a failed write', async () => {
    const persist = vi.fn().mockRejectedValueOnce(new Error('disk')).mockResolvedValue(undefined);
    const store = new SettingsStore(null, persist);
    const first = store.update({ headingAlignment: 'left' });
    const second = store.update({ diagramsEnabled: false });
    await expect(first).rejects.toThrow('disk');
    await second;
    expect(persist.mock.calls.map(([value]) => value)).toEqual([
      { version: 2, headingAlignment: 'left', diagramsEnabled: true, zenMode: false },
      { version: 2, headingAlignment: 'left', diagramsEnabled: false, zenMode: false },
    ]);
  });
});
