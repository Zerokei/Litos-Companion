import type { DiagramPalette } from '../../theme/bridge';
export function diagramCSS(p: DiagramPalette): string {
  return `
.node text { font-size: 14px; font-weight: 600; }
.node tspan[font-weight="normal"], .edgeLabels tspan[font-weight="normal"] { font-weight: 600; }
.edgeLabels text { font-size: 13px; font-weight: 600; }
.node.litos-card .label-container { rx: ${p.shape.nodeRadius}px; ry: ${p.shape.nodeRadius}px; stroke-width: ${p.shape.lineWidth}px; }
.node.litos-decision .label-container { fill: ${p.label}; stroke-dasharray: 2 2; }
.edgeLabel .label rect.background { fill: ${p.label}; stroke: ${p.border}; stroke-width: ${p.shape.lineWidth}px; rx: ${p.shape.edgeLabelRadius}px; ry: ${p.shape.edgeLabelRadius}px; opacity: 1; }
.edgePaths .flowchart-link { stroke-width: ${p.shape.lineWidth}px; stroke-linecap: round; stroke-linejoin: round; }
.marker path { stroke: ${p.line}; }
`;
}
