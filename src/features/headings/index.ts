import { isLitos } from '../../theme/bridge';
import type { CompanionSettings } from '../../settings/model';

const CLASSES = ['litos-companion-active', 'litos-companion-h2-left', 'litos-companion-h2-right'];

export class HeadingControls {
  private documents = new Set<Document>();
  private clear(doc: Document): void {
    doc.body.classList.remove(...CLASSES);
    this.documents.delete(doc);
  }
  update(documents: Document[], settings: CompanionSettings): void {
    const present = new Set(documents);
    for (const doc of this.documents) {
      if (!present.has(doc) || !isLitos(doc)) this.clear(doc);
    }
    for (const doc of documents) {
      if (!isLitos(doc)) continue;
      this.documents.add(doc);
      doc.body.classList.add('litos-companion-active');
      doc.body.classList.toggle('litos-companion-h2-left', settings.headingAlignment === 'left');
      doc.body.classList.toggle('litos-companion-h2-right', settings.headingAlignment === 'right');
    }
  }
  dispose(): void {
    for (const doc of this.documents) this.clear(doc);
  }
}
