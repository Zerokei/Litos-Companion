import { describe, expect, it, vi } from 'vitest';
import { interceptMermaid, type MermaidHost } from '../src/integrations/obsidian/mermaid';
import { RenderQueue } from '../src/features/diagrams/queue';
const result = (svg: string) => ({ svg, diagramType: 'flowchart' });
describe('renderer ownership and fallback', () => {
  it('falls back on unsupported input or failed enhancement', async () => {
    const original = vi.fn(async () => result('native'));
    const host: MermaidHost = { render: original };
    const failed = vi.fn();
    const enhance = vi.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('render'));
    const dispose = interceptMermaid(host, enhance, failed);
    expect((await host.render('a', 'source')).svg).toBe('native');
    expect((await host.render('b', 'source')).svg).toBe('native');
    expect(failed).toHaveBeenCalledTimes(1);
    dispose(); expect(host.render).toBe(original);
  });
  it('does not overwrite a later wrapper and becomes inert on unload', async () => {
    const original = vi.fn(async () => result('native'));
    const host: MermaidHost = { render: original };
    const enhance = vi.fn(async () => result('enhanced'));
    const dispose = interceptMermaid(host, enhance, vi.fn());
    const ours = host.render;
    const later = vi.fn((...args: Parameters<MermaidHost['render']>) => ours(...args));
    host.render = later;
    dispose();
    expect(host.render).toBe(later);
    expect((await host.render('a', 'source')).svg).toBe('native');
    expect(enhance).not.toHaveBeenCalled();
  });
  it('discards an in-flight enhanced result after unloading', async () => {
    let complete!: (value: ReturnType<typeof result>) => void;
    const host: MermaidHost = { render: vi.fn(async () => result('native')) };
    const dispose = interceptMermaid(host, () => new Promise(resolve => { complete = resolve; }), vi.fn());
    const rendering = host.render('a', 'source');
    dispose(); complete(result('stale'));
    expect((await rendering).svg).toBe('native');
  });
  it('serializes rendering, including after failure', async () => {
    const queue = new RenderQueue(); const events: string[] = [];
    let release!: () => void;
    const first = queue.run(async () => { events.push('start'); await new Promise<void>(resolve => { release = resolve; }); throw new Error('failed'); });
    const second = queue.run(async () => { events.push('next'); return 2; });
    await Promise.resolve(); expect(events).toEqual(['start']);
    release(); await expect(first).rejects.toThrow('failed');
    expect(await second).toBe(2); expect(events).toEqual(['start', 'next']);
  });
});
