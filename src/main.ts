import { Notice, Plugin } from 'obsidian';
import { SettingsStore, type CompanionSettings } from './settings/model';
import { CompanionSettingTab } from './settings/tab';
import { HeadingControls } from './features/headings';
import { DiagramEnhancement } from './features/diagrams';
import { refreshMarkdown, workspaceDocuments } from './integrations/obsidian/workspace';

export default class LitosCompanion extends Plugin {
  private store!: SettingsStore;
  private headings = new HeadingControls();
  private diagrams = new DiagramEnhancement();
  private tab!: CompanionSettingTab;
  private disposed = false;
  private refreshTimer?: number;

  async onload(): Promise<void> {
    this.store = new SettingsStore(await this.loadData(), value => this.saveData(value));
    this.tab = new CompanionSettingTab(this.app, this, () => this.store.value, patch => this.updateSettings(patch));
    this.addSettingTab(this.tab);
    this.registerEvent(this.app.workspace.on('css-change', () => {
      this.headings.update(workspaceDocuments(this.app), this.store.value);
      this.diagrams.invalidate(); this.scheduleRefresh();
      this.tab.update();
    }));
    this.registerEvent(this.app.workspace.on('window-open', (_workspace, win) => {
      this.headings.update([...workspaceDocuments(this.app), win.document], this.store.value);
    }));
    this.registerEvent(this.app.workspace.on('window-close', () => {
      this.headings.update(workspaceDocuments(this.app).filter(doc => !doc.defaultView?.closed), this.store.value);
    }));
    this.app.workspace.onLayoutReady(() => { if (!this.disposed) void this.applyInitialSettings(); });
  }
  private async applyInitialSettings(): Promise<void> {
    this.headings.update(workspaceDocuments(this.app), this.store.value);
    try { await this.diagrams.setEnabled(this.store.value.diagramsEnabled); }
    catch (error) { console.error('[Litos Companion]', error); new Notice('图表增强加载失败，内置 Mermaid 仍可使用。'); }
    if (!this.disposed && this.store.value.diagramsEnabled) this.scheduleRefresh();
  }
  async updateSettings(patch: Partial<Omit<CompanionSettings, 'version'>>): Promise<void> {
    const save = this.store.update(patch);
    this.headings.update(workspaceDocuments(this.app), this.store.value);
    try {
      await Promise.all([save, (async () => {
        if (patch.diagramsEnabled === undefined) return;
        await this.diagrams.setEnabled(this.store.value.diagramsEnabled);
        this.scheduleRefresh();
      })()]);
    } catch (error) { console.error('[Litos Companion]', error); new Notice('设置未能完整保存或应用，请重试。'); }
  }
  private scheduleRefresh(): void {
    if (this.disposed) return;
    window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = undefined;
      if (!this.disposed) refreshMarkdown(this.app);
    }, 150);
  }
  onunload(): void {
    this.disposed = true;
    window.clearTimeout(this.refreshTimer);
    this.diagrams.dispose(); this.headings.dispose();
    refreshMarkdown(this.app);
  }
}
