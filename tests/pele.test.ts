import { describe, expect, it, vi } from 'vitest';
import { interceptPele } from '../src/integrations/obsidian/pele';

function setup() {
  const native = vi.fn((element: HTMLElement, initial: string) => {
    const handle = {
      source: initial, refresh: vi.fn(), destroy: vi.fn(),
      update(source: string) { this.source = source; element.textContent = source; },
    };
    handle.update(initial);
    return handle;
  });
  type NativeMount = (element: HTMLElement, source: string, mountOptions?: typeof options) => ReturnType<typeof native>;
  // Reproduce Pele's non-configurable 'mount' getter on a writable global.
  const original = Object.defineProperty({}, 'mount', { get: () => native }) as { mount: NativeMount };
  const scope = { pele: original };
  let enabled = true;
  const requests: Array<(result: { svg: string } | null) => void> = [];
  const render = vi.fn(() => new Promise<{ svg: string } | null>(resolve => requests.push(resolve)));
  const failed = vi.fn();
  const hook = interceptPele(scope as unknown as Window,
    source => enabled && source.startsWith('elk') ? source : null, render, failed)!;
  const element = document.createElement('div');
  element.className = 'mermaid';
  const sanitize = vi.fn((svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement);
  const options = { sanitize, onRender: vi.fn() };
  return { hook, original, scope, element, native, options, requests, render, failed,
    disable: () => { enabled = false; hook.refresh(); } };
}
const svg = '<svg xmlns="http://www.w3.org/2000/svg" class="litos-companion-diagram" viewBox="0 0 50 40"/>';
describe('Obsidian note mounts', () => {
  it('preserves the native lifecycle for default sources, and switches as an existing fence is edited', async () => {
    const s = setup();
    const handle = s.scope.pele.mount(s.element, 'native', s.options);
    expect(s.native).toHaveBeenCalledTimes(1);
    expect(s.render).not.toHaveBeenCalled();
    handle.refresh();
    const initial = s.native.mock.results[0]!.value;
    expect(initial.refresh).toHaveBeenCalledOnce();
    handle.update('elk selected');
    expect(initial.destroy).toHaveBeenCalledOnce();
    s.requests[0]!({ svg });
    await Promise.resolve();
    expect(s.options.sanitize).toHaveBeenCalledWith(svg);
    expect(s.options.onRender).toHaveBeenCalledWith(expect.objectContaining({ width: 50, height: 40 }));
    expect(s.element.querySelector('.litos-companion-diagram')).not.toBeNull();
    handle.update('native again');
    expect(s.element.textContent).toBe('native again');
    expect(s.native).toHaveBeenCalledTimes(2);
  });

  it('drops stale async results after edits, disabling, remounting, and unloading', async () => {
    const s = setup();
    const first = s.scope.pele.mount(s.element, 'elk 1', s.options);
    first.update('native edit');
    s.requests[0]!({ svg });
    await Promise.resolve();
    expect(s.element.textContent).toBe('native edit');
    first.update('elk 2');
    const next = s.scope.pele.mount(s.element, 'elk 3', s.options);
    s.requests[1]!({ svg });
    s.disable();
    s.requests[2]!({ svg });
    await Promise.resolve();
    expect(s.element.textContent).toBe('elk 3');
    next.destroy();
    s.hook.restore();
    expect(s.scope.pele).toBe(s.original);
    expect(s.options.sanitize).not.toHaveBeenCalled();
  });

  it('restores native rendering on unload even under a later global wrapper', async () => {
    const s = setup();
    const ours = s.scope.pele;
    s.scope.pele = { mount: (...args) => ours.mount(...args) };
    const later = s.scope.pele;
    s.scope.pele.mount(s.element, 'elk pending', s.options);
    s.hook.restore();
    expect(s.scope.pele).toBe(later);
    s.requests[0]!({ svg });
    await Promise.resolve();
    expect(s.element.textContent).toBe('elk pending');
    expect(s.options.sanitize).not.toHaveBeenCalled();
    s.scope.pele.mount(s.element, 'elk after unload', s.options);
    expect(s.render).toHaveBeenCalledTimes(1);
  });

  it('uses the host fallback when render or sanitization fails', async () => {
    const s = setup();
    const handle = s.scope.pele.mount(s.element, 'elk fallback', s.options);
    s.requests[0]!(null);
    await Promise.resolve();
    expect(s.element.textContent).toBe('elk fallback');
    handle.update('elk invalid SVG');
    s.requests[1]!({ svg: '<span/>' });
    await Promise.resolve();
    expect(s.failed).toHaveBeenCalledOnce();
    expect(s.element.textContent).toBe('elk invalid SVG');
  });

  it('keeps native handles on setting refresh and redraws detached ELK only after reinsertion', async () => {
    const s = setup();
    const defaultElement = document.createElement('div');
    defaultElement.className = 'mermaid';
    s.scope.pele.mount(defaultElement, 'native', s.options);
    const nativeUpdate = vi.spyOn(s.native.mock.results[0]!.value, 'update');
    const handle = s.scope.pele.mount(s.element, 'elk detached', s.options);
    s.hook.refresh();
    s.requests[0]!({ svg });
    await Promise.resolve();
    expect(s.render).toHaveBeenCalledTimes(1);
    expect(s.options.onRender).not.toHaveBeenCalled();
    document.body.append(s.element);
    try {
      handle.refresh();
      expect(s.render).toHaveBeenCalledTimes(2);
      s.requests[1]!({ svg });
      await Promise.resolve();
      expect(s.element.querySelector('svg')).not.toBeNull();
      s.hook.restore();
      expect(s.element.textContent).toBe('elk detached');
      expect(nativeUpdate).not.toHaveBeenCalled();
    } finally { s.element.remove(); }
  });

  it('ignores non-note mounts and hosts without Pele', () => {
    const s = setup();
    s.scope.pele.mount(document.createElement('div'), 'elk external', s.options);
    s.scope.pele.mount(s.element, 'elk foreign');
    expect(s.render).not.toHaveBeenCalled();
    expect(s.native).toHaveBeenCalledTimes(2);
    expect(interceptPele({} as Window, () => null, s.render, s.failed)).toBeNull();
  });
});
