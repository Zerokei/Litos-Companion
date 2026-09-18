import type { DiagramPalette } from '../../theme/bridge';
export function diagramCSS(p: DiagramPalette): string {
  return `
.node text { font-size: 14px; font-weight: 600; }
.node tspan[font-weight="normal"], .edgeLabels tspan[font-weight="normal"] { font-weight: 600; }
.edgeLabels text { font-size: 13px; font-weight: 600; }
.node.litos-card .label-container { rx: 16px; ry: 16px; stroke-width: 1px; }
.node.litos-decision .label-container { fill: ${p.label}; stroke-dasharray: 2 2; }
.edgeLabel .label rect.background { fill: ${p.label}; stroke: ${p.border}; stroke-width: 1px; rx: 13px; ry: 13px; opacity: 1; }
.edgePaths .flowchart-link { stroke-width: 1px; stroke-linecap: round; stroke-linejoin: round; }
.marker path { stroke: ${p.line}; }
`;
}
