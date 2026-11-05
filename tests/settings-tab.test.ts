import { afterEach, describe, expect, it, vi } from 'vitest';
import type { App, Plugin } from 'obsidian';
import { CompanionSettingTab } from '../src/settings/tab';
import { DEFAULT_SETTINGS } from '../src/settings/model';

describe('declarative settings', () => {
  afterEach(() => document.body.removeAttribute('style'));
  const makeTab = (recentDocument?: Document) => {
    const change = vi.fn().mockResolvedValue(undefined);
    const app = { workspace: {
      containerEl: document.body,
      getMostRecentLeaf: () => recentDocument ? { getContainer: () => ({ doc: recentDocument }) } : null,
    } } as unknown as App;
    const tab = new CompanionSettingTab(app, {} as Plugin, () => ({ ...DEFAULT_SETTINGS, headingAlignment: 'left' }), change);
    return { tab, change };
  };
  it('exposes controls to search and reads the plugin store', () => {
    const { tab } = makeTab();
    const groups = tab.getSettingDefinitions();
    const keys = groups.flatMap(group => 'items' in group ? group.items ?? [] : [])
      .flatMap(item => 'control' in item && item.control ? item.control.key : []);
    expect(keys).toEqual(['zenMode', 'headingAlignment', 'diagramsEnabled']);
    expect(tab.getControlValue('headingAlignment')).toBe('left');
    expect(tab.getControlValue('diagramsEnabled')).toBe(true);
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
  it('reads the active note window when Settings has its own unthemed document', () => {
    const popout = document.body.appendChild(document.createElement('iframe'));
    try {
      const notes = popout.contentDocument!;
      notes.body.style.setProperty('--litos-companion-api', '1');
      notes.body.style.setProperty('--litos-theme-version', '1.2.1');
      const { tab } = makeTab(notes);
      tab.containerEl = document.implementation.createHTMLDocument('Settings').createElement('div');
      const settings = JSON.stringify(tab.getSettingDefinitions());
      expect(settings).toContain('Litos 1.2.1，接口 1：兼容');
      expect(settings).toContain('同时调整阅读模式和实时预览中的二级标题。');
      notes.body.style.setProperty('--litos-companion-api', '2');
      expect(JSON.stringify(tab.getSettingDefinitions())).toContain('当前插件支持接口 1');
    } finally { popout.remove(); }
  });

  it('recomputes compatibility descriptions when the theme changes', () => {
    const { tab } = makeTab();
    expect(JSON.stringify(tab.getSettingDefinitions())).toContain('当前主题未提供');
    document.body.style.setProperty('--litos-companion-api', '1');
    expect(JSON.stringify(tab.getSettingDefinitions())).not.toContain('当前主题未提供');
  });
});
