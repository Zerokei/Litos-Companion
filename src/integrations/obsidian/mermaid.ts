import type { RenderResult } from 'mermaid';
export type Render = (id: string, text: string, container?: Element) => Promise<RenderResult>;
export interface MermaidHost { render: Render }

/** An inert wrapper can safely remain inside a later plugin's wrapper chain. */
export function interceptMermaid(
  host: MermaidHost,
  enhance: (id: string, text: string, container?: Element) => Promise<RenderResult | null>,
  failed: (error: unknown) => void,
): () => void {
  const original = host.render;
  let active = true;
  const wrapper: Render = async function (id, text, container) {
    if (active) {
      try {
        const result = await enhance(id, text, container);
        if (active && result) return result;
      } catch (error) { if (active) failed(error); }
    }
    return original.call(host, id, text, container);
  };
  host.render = wrapper;
  return () => {
    active = false;
    if (host.render === wrapper) host.render = original;
  };
}
