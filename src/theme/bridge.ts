export interface DiagramPalette {
  dark: boolean;
  surface: string;
  node: string;
  text: string;
  border: string;
  line: string;
  label: string;
  font: string;
}
export function isLitos(doc: Document): boolean {
  return doc.defaultView?.getComputedStyle(doc.body).getPropertyValue('--litos-companion-api').trim() === '1';
}

// Mermaid derives colors using a parser that does not support all modern CSS colors.
// Resolve CSS variables through the browser, then normalize to an opaque hex color.
function resolveColor(doc: Document, input: string, fallback: string): string {
  const probe = doc.createElement('span');
  probe.style.color = input || fallback;
  probe.style.display = 'none';
  doc.body.append(probe);
  const resolved = doc.defaultView?.getComputedStyle(probe).color || fallback;
  probe.remove();
  const context = doc.createElement('canvas').getContext('2d');
  if (!context) return fallback;
  context.fillStyle = fallback;
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = resolved;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}
export function readPalette(doc: Document): DiagramPalette {
  const style = doc.defaultView!.getComputedStyle(doc.body);
  const dark = doc.body.classList.contains('theme-dark');
  const color = (name: string, standard: string, fallback: string) =>
    resolveColor(doc, `var(--litos-diagram-${name}, var(${standard}))`, fallback);
  return {
    dark,
    surface: color('surface', '--background-primary', dark ? '#202020' : '#ffffff'),
    node: color('node', '--background-secondary', dark ? '#282828' : '#f4f4f4'),
    text: color('text', '--text-normal', dark ? '#dddddd' : '#333333'),
    border: color('border', '--background-modifier-border', dark ? '#484848' : '#dddddd'),
    line: color('line', '--text-muted', dark ? '#aaaaaa' : '#666666'),
    label: color('label', '--background-primary', dark ? '#202020' : '#ffffff'),
    font: style.getPropertyValue('--font-text').trim() || 'sans-serif',
  };
}
