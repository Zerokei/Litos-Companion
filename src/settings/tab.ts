import { readAccent, writeAccent } from '../integrations/obsidian/accent';
import { Notice, PluginSettingTab, type App, type Plugin, type SettingDefinitionItem, type ExtraButtonComponent } from 'obsidian';
import { isLitos } from '../theme/bridge';
import { DEFAULT_SETTINGS, type CompanionSettings } from './model';

type SettingKey = 'headingAlignment' | 'diagramsEnabled' | 'zenMode';

export class CompanionSettingTab extends PluginSettingTab {
  constructor(app: App, plugin: Plugin,
    private readonly settings: () => CompanionSettings,
    private readonly change: (patch: Partial<Omit<CompanionSettings, 'version'>>) => Promise<void>,
  ) { super(app, plugin); }

  getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
    const compatible = isLitos(this.containerEl.ownerDocument);
    return [
      { type: 'group', heading: '专注显示', items: [{
        name: 'Zen mode',
        desc: '隐藏快捷工具栏、侧栏切换按钮、文档操作按钮、状态栏和新建标签加号。保留标签页与路径，可通过命令面板切换退出。',
        aliases: ['zen', 'focus'],
        control: { type: 'toggle', key: 'zenMode', defaultValue: false },
      }] },
      {
        type: 'group', heading: 'Litos 显示', items: [{
          name: '强调色',
          desc: '与 Obsidian 外观设置同步，仅影响当前仓库。停用插件后仍保留。',
          aliases: ['accent', 'color'],
          render: setting => {
            const current = readAccent(this.app);
            if (!current) {
              setting.setDesc('当前 Obsidian 版本的强调色接口不可用，请使用原生外观设置。');
              return;
            }
            let reset: ExtraButtonComponent | undefined;
            const apply = (color: string) => {
              if (!writeAccent(this.app, color)) new Notice('强调色未能更新，请使用原生外观设置。');
              reset?.setDisabled(!readAccent(this.app)?.custom);
            };
            setting.addColorPicker(picker => picker.setValue(current.color).onChange(color => apply(color)));
            setting.addExtraButton(button => {
              reset = button;
              button.setIcon('reset').setTooltip('恢复默认')
                .setDisabled(!current.custom).onClick(() => { apply(''); this.update(); });
            });
          },
        }, {
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
    if (key === 'headingAlignment' || key === 'diagramsEnabled' || key === 'zenMode') return this.settings()[key];
    return undefined;
  }

  setControlValue(key: string, value: unknown): void | Promise<void> {
    if (key === 'headingAlignment' && (value === 'left' || value === 'right')) {
      return this.change({ headingAlignment: value });
    }
    if (key === 'zenMode' && typeof value === 'boolean') return this.change({ zenMode: value });
    if (key === 'diagramsEnabled' && typeof value === 'boolean') {
      return this.change({ diagramsEnabled: value });
    }
  }
}
