import { loadMermaid, Notice } from 'obsidian';
import { interceptMermaid, type MermaidHost } from '../../integrations/obsidian/mermaid';
import { interceptPele } from '../../integrations/obsidian/pele';
import { prepareFlowchart } from './routing';
import { DiagramRuntime } from './runtime';

export class DiagramEnhancement {
  private enabled = false;
  private active = true;
  private warned = false;
  private generation = 0;
  private runtime = new DiagramRuntime();
  private restore?: () => void;
  private refreshMounts?: () => void;
  private installing?: Promise<void>;
  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    this.generation++;
    this.refreshMounts?.();
    if (!enabled || !this.active || this.restore) return;
    if (!this.installing) this.installing = this.install();
    try { await this.installing; } finally { this.installing = undefined; }
  }
  private async install(): Promise<void> {
    const host = await loadMermaid() as MermaidHost;
    if (!this.active || !this.enabled || this.restore) return;
    const prepare = (source: string) => this.active && this.enabled ? prepareFlowchart(source) : null;
    const render = async (id: string, prepared: string, container?: Element, embedPresentation = false,
      isCurrent: () => boolean = () => true) => {
      const generation = this.generation;
      const result = await this.runtime.render(id, prepared, container, embedPresentation,
        () => this.active && this.enabled && generation === this.generation && isCurrent());
      return this.active && this.enabled && generation === this.generation ? result : null;
    };
    const failed = (error: unknown) => {
      console.warn('[Litos Companion] Enhanced rendering failed; using Obsidian renderer.', error);
      if (!this.warned) {
        this.warned = true;
        new Notice('此流程图暂时无法增强，已使用 Obsidian 内置渲染。');
      }
    };
    const pele = interceptPele(window, prepare, (id, source, element, isCurrent) => render(id, source, element, true, isCurrent), failed);
    if (pele) {
      this.restore = () => pele.restore();
      this.refreshMounts = () => pele.refresh();
      return;
    }
    // Older Obsidian releases render note fences through the Mermaid facade.
    this.restore = interceptMermaid(host, (id, source, container) => {
      const prepared = prepare(source);
      return prepared ? render(id, prepared, container) : Promise.resolve(null);
    }, failed);
  }
  invalidate(): void { this.generation++; this.refreshMounts?.(); }
  dispose(): void {
    this.active = false; this.enabled = false; this.generation++;
    this.runtime.dispose(); this.restore?.(); this.restore = undefined;
  }
}
