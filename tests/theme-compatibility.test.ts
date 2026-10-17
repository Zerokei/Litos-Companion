import { afterEach, describe, expect, it, vi } from 'vitest';
import type { App } from 'obsidian';
import { compareVersions, describeThemeCompatibility, inspectTheme, setInstalledTheme } from '../src/theme/compatibility';
import { DEFAULT_DIAGRAM_SHAPE, isLitos, readDiagramShape } from '../src/theme/bridge';
import { readInstalledTheme } from '../src/integrations/obsidian/theme';

afterEach(() => { document.body.removeAttribute('style'); setInstalledTheme(document, null); });
const theme = (api = '1', version = '1.2.0') => {
  document.body.style.setProperty('--litos-companion-api', api);
  if (version) document.body.style.setProperty('--litos-theme-version', `"${version}"`);
};
describe('theme compatibility', () => {
  it('accepts newer versions that preserve the supported contract', () => {
    theme('1', '2.10.0');
    expect(inspectTheme(document).status).toBe('compatible');
    expect(isLitos(document)).toBe(true);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });
  it.each([
    ['2', '1.2.0', 'unsupported-api'], ['invalid', '1.2.0', 'unsupported-api'],
    ['1', '1.1.2', 'too-old'], ['1', '1.2.0-beta', 'invalid-version'],
  ])('disables theme-specific behavior for API %s / version %s', (api, version, status) => {
    theme(api, version);
    expect(inspectTheme(document).status).toBe(status);
    expect(isLitos(document)).toBe(false);
  });
  it('detects installed versions of older API 1 themes without CSS metadata', () => {
    theme('1', '');
    setInstalledTheme(document, { name: 'Litos', version: '1.1.3' });
    expect(inspectTheme(document)).toMatchObject({ status: 'compatible', version: '1.1.3' });
    setInstalledTheme(document, { name: 'Litos', version: '1.1.2' });
    expect(inspectTheme(document).status).toBe('too-old');
  });
  it('distinguishes missing contracts, unknown versions and stale loaded CSS', () => {
    expect(inspectTheme(document).status).toBe('other-theme');
    setInstalledTheme(document, { name: 'Litos', version: '1.1.3' });
    expect(inspectTheme(document).status).toBe('missing-api');
    setInstalledTheme(document, null); theme('1', '');
    expect(inspectTheme(document).status).toBe('unverified');
    expect(describeThemeCompatibility(document)).toContain('无法确认主题版本');
    theme(); setInstalledTheme(document, { name: 'Litos', version: '1.2.1' });
    expect(inspectTheme(document).status).toBe('stale-css');
    expect(isLitos(document)).toBe(false);
  });
  it('reads each window independently and returns to compatible behavior', () => {
    const frame = document.createElement('iframe'); document.body.append(frame);
    try {
      theme();
      expect(isLitos(document)).toBe(true);
      expect(isLitos(frame.contentDocument!)).toBe(false);
      theme('2'); expect(isLitos(document)).toBe(false);
      theme('1'); expect(isLitos(document)).toBe(true);
    } finally { frame.remove(); }
  });
});
describe('diagram style tokens', () => {
  it('adapts valid tokens while preserving legacy defaults', () => {
    theme();
    expect(readDiagramShape(document)).toEqual(DEFAULT_DIAGRAM_SHAPE);
    document.body.style.setProperty('--litos-diagram-node-radius', '24px');
    document.body.style.setProperty('--litos-diagram-label-radius', '0');
    document.body.style.setProperty('--litos-diagram-line-width', '1.5px');
    expect(readDiagramShape(document)).toEqual({ nodeRadius: 24, edgeLabelRadius: 0, lineWidth: 1.5 });
    theme('2');
    expect(readDiagramShape(document)).toEqual(DEFAULT_DIAGRAM_SHAPE);
  });
  it.each(['-1px', '1000px', '12em', 'calc(20px)', '1;fill:red', 'NaN'])('ignores invalid token %s', value => {
    theme(); document.body.style.setProperty('--litos-diagram-node-radius', value);
    expect(readDiagramShape(document).nodeRadius).toBe(DEFAULT_DIAGRAM_SHAPE.nodeRadius);
  });
});
describe('installed theme metadata', () => {
  it('uses the configured vault folder and selected theme without network requests', async () => {
    const read = vi.fn().mockResolvedValueOnce('{"cssTheme":"Litos"}').mockResolvedValueOnce('{"name":"Litos","version":"1.1.3"}');
    const app = { vault: { configDir: '.custom-config', adapter: { read } } } as unknown as App;
    expect(await readInstalledTheme(app)).toEqual({ name: 'Litos', version: '1.1.3' });
    expect(read.mock.calls).toEqual([['.custom-config/appearance.json'], ['.custom-config/themes/Litos/manifest.json']]);
  });
  it.each(['../private', 'folder/theme', '..', ''])('does not follow invalid theme directory %s', async folder => {
    const read = vi.fn().mockResolvedValue(JSON.stringify({ cssTheme: folder }));
    const app = { vault: { configDir: '.obsidian', adapter: { read } } } as unknown as App;
    expect(await readInstalledTheme(app)).toBeNull();
    expect(read).toHaveBeenCalledTimes(1);
  });
  it('fails safely when metadata is missing or malformed', async () => {
    const app = { vault: { configDir: '.obsidian', adapter: { read: vi.fn().mockRejectedValue(new Error('missing')) } } } as unknown as App;
    expect(await readInstalledTheme(app)).toBeNull();
  });
});
