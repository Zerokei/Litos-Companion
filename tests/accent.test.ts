import { describe, expect, it, vi } from 'vitest';
import type { App } from 'obsidian';
import { readAccent, writeAccent } from '../src/integrations/obsidian/accent';

describe('host accent adapter', () => {
  it('uses the same host setting for changes and reset', () => {
    let value = '';
    const setConfig = vi.fn((_key: string, next: string) => { value = next; });
    const app = { getAccentColor: () => value || '#123456', vault: { getConfig: () => value, setConfig } } as unknown as App;
    expect(readAccent(app)).toEqual({ color: '#123456', custom: false });
    expect(writeAccent(app, '#abcdef')).toBe(true);
    expect(readAccent(app)).toEqual({ color: '#abcdef', custom: true });
    expect(writeAccent(app, '')).toBe(true);
    expect(setConfig.mock.calls).toEqual([['accentColor', '#abcdef'], ['accentColor', '']]);
    expect(writeAccent(app, 'invalid')).toBe(false);
    expect(setConfig).toHaveBeenCalledTimes(2);
  });
  it('fails safely when internal APIs are unavailable or throw', () => {
    expect(readAccent({} as App)).toBeNull();
    expect(writeAccent({} as App, '#abcdef')).toBe(false);
    const app = { getAccentColor: () => { throw new Error('unsupported'); }, vault: { getConfig: vi.fn(), setConfig: vi.fn() } } as unknown as App;
    expect(readAccent(app)).toBeNull();
    expect(writeAccent(app, '')).toBe(false);
  });
});
