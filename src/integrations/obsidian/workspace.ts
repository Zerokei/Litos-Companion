import { MarkdownView, type App } from 'obsidian';

export function workspaceDocuments(app: App): Document[] {
  const documents = new Set<Document>([document]);
  app.workspace.iterateAllLeaves(leaf => documents.add(leaf.view.containerEl.ownerDocument));
  return [...documents];
}
/**
 * Obsidian 1.13.7 caches live-preview widgets in this extension array. Rebuild
 * the extensions, not the editor state: text, selection and undo stay intact.
 * Keep this guarded compatibility access here; future hosts can omit it safely.
 */
export function invalidateLivePreview(view: MarkdownView): void {
  const compatible = view as MarkdownView & {
    currentMode?: { livePreviewPlugin?: unknown; sourceMode?: boolean };
  };
  const mode = compatible.currentMode;
  if (view.getMode() === 'source' && mode?.sourceMode === false && Array.isArray(mode.livePreviewPlugin)) {
    mode.livePreviewPlugin = null;
  }
}

export function refreshMarkdown(app: App): void {
  app.workspace.iterateAllLeaves(leaf => {
    if (leaf.view instanceof MarkdownView) {
      leaf.view.previewMode.rerender(true);
      invalidateLivePreview(leaf.view);
    }
  });
  app.workspace.updateOptions();
}
