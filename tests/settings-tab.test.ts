import { afterEach, describe, expect, it, vi } from 'vitest';
import type { App, Plugin } from 'obsidian';
import { CompanionSettingTab } from '../src/settings/tab';
import { DEFAULT_SETTINGS } from '../src/settings/model';

describe('declarative settings', () => {
  afterEach(() => document.body.removeAttribute('style'));
  const makeTab = () => {
    const change = vi.fn().mockResolvedValue(undefined);
    const tab = new CompanionSettingTab({} as App, {} as Plugin, () => ({ ...DEFAULT_SETTINGS, headingAlignment: 'left' }), change);
    return { tab, change };
  };
  it('exposes both controls to search and reads the plugin store', () => {
    const { tab } = makeTab();
    const groups = tab.getSettingDefinitions();
    const keys = groups.flatMap(group => 'items' in group ? group.items ?? [] : [])
      .flatMap(item => 'control' in item && item.control ? item.control.key : []);
    expect(keys).toEqual(['zenMode', 'headingAlignment', 'diagramsEnabled']);
    expect(tab.getControlValue('headingAlignment')).toBe('left');
    expect(tab.getControlValue('diagramsEnabled')).toBe(false);
    expect(tab.getControlValue('unknown')).toBeUndefined();
  });
  it('persists validated values through the plugin callback only', async () => {
    const { tab, change } = makeTab();
    await tab.setControlValue('headingAlignment', 'right');
    await tab.setControlValue('diagramsEnabled', true);
    await tab.setControlValue('diagramsEnabled', 'true');
    await tab.setControlValue('headingAlignment', 'center');
    await tab.setControlValue('version', 99);
    expect(change.mock.calls).toEqual([[{ headingAlignment: 'right' }], [{ diagramsEnabled: true }]]);
  });
  it('recomputes compatibility descriptions when the theme changes', () => {
    const { tab } = makeTab();
    expect(JSON.stringify(tab.getSettingDefinitions())).toContain('当前主题未提供');
    document.body.style.setProperty('--litos-companion-api', '1');
    expect(JSON.stringify(tab.getSettingDefinitions())).not.toContain('当前主题未提供');
  });
});
