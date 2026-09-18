import { describe, expect, it } from 'vitest';
import { decorateSvg } from '../src/features/diagrams/svg';

describe('SVG decoration', () => {
  it('preserves namespaces, classes, styles and escaped labels without inserting live DOM', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" class="flowchart" viewBox="0 0 100 60"><style>.node { fill: #fff; }</style><text>中文 &amp; &lt;标签&gt;</text></svg>';
    const parsed = new DOMParser().parseFromString(decorateSvg(source), 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.documentElement.getAttribute('class')).toBe('flowchart litos-companion-diagram');
    expect(parsed.documentElement.getAttribute('data-litos-layout')).toBe('elk');
    expect(parsed.querySelector('text')?.textContent).toBe('中文 & <标签>');
    expect(parsed.querySelector('style')?.textContent).toContain('fill: #fff');
    expect(document.querySelector('.litos-companion-diagram')).toBeNull();
  });
  it.each(['<svg>', '<html></html>', '<svg xmlns="https://example.com"/>'])('rejects malformed or non-SVG output', source => {
    expect(() => decorateSvg(source)).toThrow('valid SVG');
  });
});
