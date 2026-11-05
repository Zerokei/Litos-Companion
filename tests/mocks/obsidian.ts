// Obsidian supplies this module at runtime; its npm package contains types only.
import type { App } from 'obsidian';
export class MarkdownView {}
export class PluginSettingTab {
  containerEl = document.createElement('div');
  constructor(public app: App) {}
}
