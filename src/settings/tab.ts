import { PluginSettingTab, type App, type Plugin, type SettingDefinitionItem } from 'obsidian';
import { isLitos } from '../theme/bridge';
import { DEFAULT_SETTINGS, type CompanionSettings } from './model';

type SettingKey = 'headingAlignment' | 'diagramsEnabled';

export class CompanionSettingTab extends PluginSettingTab {
  constructor(app: App, plugin: Plugin,
    private readonly settings: () => CompanionSettings,
    private readonly change: (patch: Partial<Omit<CompanionSettings, 'version'>>) => Promise<void>,
  ) { super(app, plugin); }

  getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
    const compatible = isLitos(this.containerEl.ownerDocument);
    return [
      {
        type: 'group', heading: 'Litos 显示', items: [{
          name: '二级标题位置',
          desc: compatible ? '同时调整阅读模式和实时预览中的二级标题。' : '当前主题未提供 Litos 配套接口。选择会保存，在启用兼容的 Litos 主题后生效。',
          aliases: ['H2', 'heading', 'alignment'],
          control: { type: 'dropdown', key: 'headingAlignment', defaultValue: DEFAULT_SETTINGS.headingAlignment,
            options: { right: '靠右（默认）', left: '靠左' } },
        }],
      },
      {
        type: 'group', heading: '图表增强', items: [{
          name: '增强 Mermaid 流程图',
          desc: '为普通 Mermaid 流程图启用 ELK 排列、圆角卡片和胶囊标签。判断节点显示为虚线圆角矩形；配色跟随当前主题，其他图表保持原样。所有更改只影响显示，不修改笔记。',
          aliases: ['ELK', 'flowchart', 'diagram'],
          control: { type: 'toggle', key: 'diagramsEnabled', defaultValue: DEFAULT_SETTINGS.diagramsEnabled },
        }],
      },
    ];
  }

  getControlValue(key: string): unknown {
    if (key === 'headingAlignment' || key === 'diagramsEnabled') return this.settings()[key];
    return undefined;
  }

  setControlValue(key: string, value: unknown): void | Promise<void> {
    if (key === 'headingAlignment' && (value === 'left' || value === 'right')) {
      return this.change({ headingAlignment: value });
    }
    if (key === 'diagramsEnabled' && typeof value === 'boolean') {
      return this.change({ diagramsEnabled: value });
    }
  }
}
