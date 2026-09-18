import { PluginSettingTab, Setting, type App, type Plugin } from 'obsidian';
import { isLitos } from '../theme/bridge';
import type { CompanionSettings } from './model';

export class CompanionSettingTab extends PluginSettingTab {
  constructor(app: App, plugin: Plugin,
    private readonly settings: () => CompanionSettings,
    private readonly change: (patch: Partial<Omit<CompanionSettings, 'version'>>) => Promise<void>,
  ) { super(app, plugin); }
  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl).setName('Litos 显示').setHeading();
    const compatible = isLitos(this.containerEl.ownerDocument);
    new Setting(this.containerEl)
      .setName('二级标题位置')
      .setDesc(compatible ? '同时调整阅读模式和实时预览中的二级标题。' : '当前主题未提供 Litos 配套接口。选择会保存，在启用兼容的 Litos 主题后生效。')
      .addDropdown(control => control.addOptions({ right: '靠右（默认）', left: '靠左' })
        .setValue(this.settings().headingAlignment)
        .onChange(async value => { await this.change({ headingAlignment: value === 'left' ? 'left' : 'right' }); }));
    new Setting(this.containerEl).setName('图表增强').setHeading();
    new Setting(this.containerEl)
      .setName('增强 Mermaid 流程图')
      .setDesc('为普通 Mermaid 流程图启用 ELK 排列、圆角卡片和胶囊标签。判断节点显示为虚线圆角矩形；其他图表保持原样。')
      .addToggle(control => control.setValue(this.settings().diagramsEnabled)
        .onChange(async value => { await this.change({ diagramsEnabled: value }); }));
    this.containerEl.createEl('p', {
      cls: 'litos-companion-settings-note',
      text: '图表配色跟随当前主题。指定其他布局、手绘风格或含内部链接的图表仍使用内置渲染。所有更改只影响显示，不修改笔记。',
    });
  }
}
