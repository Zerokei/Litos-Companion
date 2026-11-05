import { describe, expect, it, vi } from 'vitest';
import type { MarkdownView } from 'obsidian';
vi.mock('obsidian', () => ({ MarkdownView: class {} }));
import { invalidateLivePreview } from '../src/integrations/obsidian/workspace';

describe('Obsidian live preview compatibility', () => {
  it('invalidates only the widget extensions without modifying editor state', () => {
    const state = { undo: ['prior edit'], text: 'a note' };
    const view = { getMode: () => 'source', currentMode: { sourceMode: false, livePreviewPlugin: [1], state } };
    invalidateLivePreview(view as unknown as MarkdownView);
    expect(view.currentMode.livePreviewPlugin).toBeNull();
    expect(view.currentMode.state).toBe(state);
  });
  it('leaves source mode and unknown host implementations alone', () => {
    const mode = { sourceMode: true, livePreviewPlugin: [1] };
    invalidateLivePreview({ getMode: () => 'source', currentMode: mode } as unknown as MarkdownView);
    expect(mode.livePreviewPlugin).toEqual([1]);
    expect(() => invalidateLivePreview({ getMode: () => 'source' } as unknown as MarkdownView)).not.toThrow();
  });
  it('invalidates the dormant live preview while reading', () => {
    const editMode = { sourceMode: false, livePreviewPlugin: [1], state: { text: 'a note' } };
    invalidateLivePreview({ getMode: () => 'preview', currentMode: {}, editMode } as unknown as MarkdownView);
    expect(editMode.livePreviewPlugin).toBeNull();
    expect(editMode.state.text).toBe('a note');
  });
});
