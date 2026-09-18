import { isLitos } from '../../theme/bridge';
import type { CompanionSettings } from '../../settings/model';

export class HeadingControls {
  private styles = new Map<Document, HTMLStyleElement>();
  private clear(doc: Document): void {
    // Obsidian may mirror a main-window style into popouts before window-open.
    for (const style of doc.querySelectorAll('style[data-litos-companion="headings"]')) style.remove();
    doc.body.classList.remove('litos-companion-active');
    this.styles.delete(doc);
  }
  update(documents: Document[], settings: CompanionSettings): void {
    const present = new Set(documents);
    for (const [doc] of this.styles) {
      if (!present.has(doc) || !isLitos(doc)) {
        this.clear(doc);
      }
    }
    for (const doc of documents) {
      if (!isLitos(doc)) continue;
      let style = this.styles.get(doc);
      if (!style?.isConnected) style = doc.querySelector<HTMLStyleElement>('style[data-litos-companion="headings"]') ?? undefined;
      if (!style) {
        style = doc.createElement('style');
        style.dataset.litosCompanion = 'headings';
      }
      // Head styles are automatically mirrored by Obsidian. Keep per-window
      // overrides on body so a newly opened popout cannot get a second copy.
      if (style.parentElement !== doc.body) doc.body.append(style);
      for (const duplicate of doc.querySelectorAll('style[data-litos-companion="headings"]')) {
        if (duplicate !== style) duplicate.remove();
      }
      this.styles.set(doc, style);
      doc.body.classList.add('litos-companion-active');
      style.textContent = `body.litos-companion-active { --litos-h2-align: ${settings.headingAlignment}; }`;
    }
  }
  dispose(): void {
    for (const [doc] of this.styles) this.clear(doc);
    this.styles.clear();
  }
}
