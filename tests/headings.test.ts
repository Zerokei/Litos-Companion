import { afterEach, describe, expect, it } from 'vitest';
import { HeadingControls } from '../src/features/headings';
import { DEFAULT_SETTINGS } from '../src/settings/model';

describe('theme contract', () => {
  afterEach(() => { document.body.replaceChildren(); document.body.removeAttribute('style'); document.body.className = ''; });
  it('applies exclusive alignment classes only to compatible themes', () => {
    const headings = new HeadingControls();
    headings.update([document], { ...DEFAULT_SETTINGS, headingAlignment: 'left' });
    expect(document.body.classList.contains('litos-companion-active')).toBe(false);
    document.body.style.setProperty('--litos-companion-api', '1');
    headings.update([document], { ...DEFAULT_SETTINGS, headingAlignment: 'left' });
    expect(document.body.classList.contains('litos-companion-h2-left')).toBe(true);
    headings.update([document], DEFAULT_SETTINGS);
    expect(document.body.classList.contains('litos-companion-h2-left')).toBe(false);
    expect(document.body.classList.contains('litos-companion-h2-right')).toBe(true);
    document.body.style.removeProperty('--litos-companion-api');
    headings.update([document], DEFAULT_SETTINGS);
    expect(document.body.className).toBe('');
  });
  it('cleans closed windows and all remaining documents on unload', () => {
    const frame = document.createElement('iframe'); document.body.append(frame);
    const popup = frame.contentDocument!;
    for (const doc of [document, popup]) doc.body.style.setProperty('--litos-companion-api', '1');
    const headings = new HeadingControls();
    headings.update([document, popup], DEFAULT_SETTINGS);
    expect(popup.body.classList.contains('litos-companion-active')).toBe(true);
    headings.update([document], DEFAULT_SETTINGS);
    expect(popup.body.className).toBe('');
    headings.dispose();
    expect(document.body.className).toBe('');
  });
  it('preserves unrelated classes and creates no style elements', () => {
    document.body.className = 'theme-dark user-class';
    document.body.style.setProperty('--litos-companion-api', '1');
    const count = document.querySelectorAll('style').length;
    const headings = new HeadingControls();
    headings.update([document], DEFAULT_SETTINGS);
    headings.update([document], DEFAULT_SETTINGS);
    expect(document.querySelectorAll('style')).toHaveLength(count);
    headings.dispose();
    expect(document.body.className).toBe('theme-dark user-class');
  });
});
