import { inspectTheme, THEME_COMPATIBILITY } from './compatibility';

export interface DiagramShape { nodeRadius: number; edgeLabelRadius: number; lineWidth: number }
export const DEFAULT_DIAGRAM_SHAPE: DiagramShape = THEME_COMPATIBILITY.diagramDefaults;
export interface DiagramPalette {
  dark: boolean;
  surface: string;
  node: string;
  text: string;
  border: string;
  line: string;
  label: string;
  font: string;
  shape: DiagramShape;
}
export function isLitos(doc: Document): boolean {
  return inspectTheme(doc).compatible;
}

export function readDiagramShape(doc: Document): DiagramShape {
  if (!isLitos(doc)) return { ...DEFAULT_DIAGRAM_SHAPE };
  const style = doc.defaultView!.getComputedStyle(doc.body);
  const number = (name: string, fallback: number, min: number, max: number): number => {
    const raw = style.getPropertyValue(name).trim();
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:px)?$/.test(raw)) return fallback;
    const value = Number.parseFloat(raw);
    return value >= min && value <= max ? value : fallback;
  };
  return {
    nodeRadius: number('--litos-diagram-node-radius', DEFAULT_DIAGRAM_SHAPE.nodeRadius, 0, 64),
    edgeLabelRadius: number('--litos-diagram-label-radius', DEFAULT_DIAGRAM_SHAPE.edgeLabelRadius, 0, 32),
    lineWidth: number('--litos-diagram-line-width', DEFAULT_DIAGRAM_SHAPE.lineWidth, 0.5, 4),
  };
}

// Mermaid derives colors using a parser that does not support all modern CSS colors.
// Resolve CSS variables through the browser, then normalize to an opaque hex color.
function resolveColor(doc: Document, input: string, fallback: string): string {
  const probe = doc.body.createSpan();
  probe.setCssStyles({ color: input || fallback, display: 'none' });
  const resolved = doc.defaultView?.getComputedStyle(probe).color || fallback;
  probe.remove();
  const canvas = doc.body.createEl('canvas');
  const context = canvas.getContext('2d');
  canvas.remove();
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
  const compatible = isLitos(doc);
  const color = (name: string, standard: string, fallback: string) =>
    resolveColor(doc, compatible ? `var(--litos-diagram-${name}, var(${standard}))` : `var(${standard})`, fallback);
  return {
    dark,
    surface: color('surface', '--background-primary', dark ? '#202020' : '#ffffff'),
    node: color('node', '--background-secondary', dark ? '#282828' : '#f4f4f4'),
    text: color('text', '--text-normal', dark ? '#dddddd' : '#333333'),
    border: color('border', '--background-modifier-border', dark ? '#484848' : '#dddddd'),
    line: color('line', '--text-muted', dark ? '#aaaaaa' : '#666666'),
    label: color('label', '--background-primary', dark ? '#202020' : '#ffffff'),
    font: style.getPropertyValue('--font-text').trim() || 'sans-serif',
    shape: readDiagramShape(doc),
  };
}
