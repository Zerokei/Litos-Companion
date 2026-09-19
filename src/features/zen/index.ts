/** Owns only a CSS class; host layout and appearance preferences stay intact. */
export class ZenMode {
  private documents = new Set<Document>();
  update(documents: Document[], enabled: boolean): void {
    const present = new Set(documents);
    for (const doc of this.documents) {
      if (!present.has(doc)) doc.body.classList.remove('litos-companion-zen');
    }
    for (const doc of present) doc.body.classList.toggle('litos-companion-zen', enabled);
    this.documents = present;
  }
  dispose(): void {
    for (const doc of this.documents) doc.body.classList.remove('litos-companion-zen');
    this.documents.clear();
  }
}
