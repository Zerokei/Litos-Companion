import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings, SettingsStore } from '../src/settings/model';
describe('settings', () => {
  it('keeps the existing appearance and diagrams opt-in', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ headingAlignment: 'center', diagramsEnabled: 'true' })).toEqual(DEFAULT_SETTINGS);
  });
  it('preserves valid preferences and discards unsupported values', () => {
    expect(normalizeSettings({ headingAlignment: 'left', diagramsEnabled: true, other: 1 }))
      .toEqual({ version: 1, headingAlignment: 'left', diagramsEnabled: true, zenMode: false });
  });
  it('serializes saves and recovers after a failed write', async () => {
    const persist = vi.fn().mockRejectedValueOnce(new Error('disk')).mockResolvedValue(undefined);
    const store = new SettingsStore(null, persist);
    const first = store.update({ headingAlignment: 'left' });
    const second = store.update({ diagramsEnabled: true });
    await expect(first).rejects.toThrow('disk');
    await second;
    expect(persist.mock.calls.map(([value]) => value)).toEqual([
      { version: 1, headingAlignment: 'left', diagramsEnabled: false, zenMode: false },
      { version: 1, headingAlignment: 'left', diagramsEnabled: true, zenMode: false },
    ]);
  });
});
