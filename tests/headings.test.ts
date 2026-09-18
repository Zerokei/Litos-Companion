import { afterEach, describe, expect, it } from 'vitest';
import { HeadingControls } from '../src/features/headings';
import { DEFAULT_SETTINGS } from '../src/settings/model';
describe('theme contract', () => {
  afterEach(() => { document.head.innerHTML = ''; document.body.removeAttribute('style'); document.body.className = ''; });
  it('activates only for compatible Litos and leaves no residue on theme change', () => {
    const headings = new HeadingControls();
    headings.update([document], { ...DEFAULT_SETTINGS, headingAlignment: 'left' });
    expect(document.head.querySelector('[data-litos-companion]')).toBeNull();
    document.body.style.setProperty('--litos-companion-api', '1');
    headings.update([document], { ...DEFAULT_SETTINGS, headingAlignment: 'left' });
    expect(document.querySelector('[data-litos-companion]')?.textContent).toContain('--litos-h2-align: left');
    document.body.style.removeProperty('--litos-companion-api');
    headings.update([document], DEFAULT_SETTINGS);
    expect(document.head.querySelector('[data-litos-companion]')).toBeNull();
    expect(document.body.classList.contains('litos-companion-active')).toBe(false);
  });
  it('adopts mirrored popout styles and removes late copies on disposal', () => {
    document.body.style.setProperty('--litos-companion-api', '1');
    const mirror = document.createElement('style');
    mirror.dataset.litosCompanion = 'headings'; document.head.append(mirror);
    const headings = new HeadingControls();
    headings.update([document], DEFAULT_SETTINGS);
    expect(document.querySelectorAll('[data-litos-companion]')).toHaveLength(1);
    document.head.append(mirror.cloneNode(true));
    headings.dispose();
    expect(document.querySelectorAll('[data-litos-companion]')).toHaveLength(0);
  });
  it('disposes all owned styles without removing unrelated styles', () => {
    document.head.innerHTML = '<style id="user">body { color: red; }</style>';
    document.body.style.setProperty('--litos-companion-api', '1');
    const headings = new HeadingControls(); headings.update([document], DEFAULT_SETTINGS);
    headings.update([document], DEFAULT_SETTINGS);
    expect(document.querySelectorAll('[data-litos-companion]')).toHaveLength(1);
    headings.dispose();
    expect(document.head.querySelector('#user')).not.toBeNull();
    expect(document.head.querySelector('[data-litos-companion]')).toBeNull();
  });
});
