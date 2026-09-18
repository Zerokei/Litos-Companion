import { loadMermaid, Notice } from 'obsidian';
import { interceptMermaid, type MermaidHost } from '../../integrations/obsidian/mermaid';
import { prepareFlowchart } from './routing';
import { DiagramRuntime } from './runtime';

export class DiagramEnhancement {
  private enabled = false;
  private active = true;
  private warned = false;
  private generation = 0;
  private runtime = new DiagramRuntime();
  private restore?: () => void;
  private installing?: Promise<void>;
  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    this.generation++;
    if (!enabled || !this.active || this.restore) return;
    if (!this.installing) this.installing = this.install();
    try { await this.installing; } finally { this.installing = undefined; }
  }
  private async install(): Promise<void> {
    const host = await loadMermaid() as MermaidHost;
    if (!this.active || this.restore) return;
    this.restore = interceptMermaid(host, async (id, source, container) => {
      if (!this.enabled || !this.active) return null;
      const prepared = prepareFlowchart(source);
      if (!prepared) return null;
      const generation = this.generation;
      const result = await this.runtime.render(id, prepared, container);
      return this.active && this.enabled && generation === this.generation ? result : null;
    }, error => {
      console.warn('[Litos Companion] Enhanced rendering failed; using Obsidian renderer.', error);
      if (!this.warned) {
        this.warned = true;
        new Notice('此流程图暂时无法增强，已使用 Obsidian 内置渲染。');
      }
    });
  }
  invalidate(): void { this.generation++; }
  dispose(): void {
    this.active = false; this.enabled = false; this.generation++;
    this.runtime.dispose(); this.restore?.(); this.restore = undefined;
  }
}
