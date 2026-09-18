import type { InternalHelpers, LayoutData, LayoutLoaderDefinition } from 'mermaid';

type MeasuredEdge = LayoutData['edges'][number] & { width?: number; height?: number };

/** ELK handles routing; this adapter measures the final shapes before layout. */
export function createLitosLayout(elk: LayoutLoaderDefinition): LayoutLoaderDefinition {
  return {
    name: 'litos-flowchart', algorithm: 'elk.layered',
    loader: async () => {
      const engine = await elk.loader();
      return {
        async render(data, svg, helpers, options) {
          for (const node of data.nodes) {
            if (node.isGroup) continue;
            const decision = ['diamond', 'diam', 'decision', 'question'].includes(node.shape ?? '');
            const card = decision || ['rect', 'squareRect', 'proc', 'process', 'rectangle', 'rounded', 'roundedRect', 'event'].includes(node.shape ?? '');
            if (!card) continue;
            // Use the unambiguous internal alias; Mermaid's legacy `rect` handler
            // can resolve to roundedRect, which ignores labelPaddingX.
            node.shape = 'squareRect';
            node.cssClasses = `${node.cssClasses ?? ''} litos-card${decision ? ' litos-decision' : ''}`;
            node.padding = 16;
            node.labelPaddingX = 36;
            node.height = Math.max(node.height ?? 0, 60);
            node.rx = node.ry = 16;
          }
          const adapted: InternalHelpers = {
            ...helpers,
            async insertEdgeLabel(element: unknown, edge: MeasuredEdge) {
              const label = await helpers.insertEdgeLabel(element, edge);
              const text = label.querySelector<SVGGraphicsElement>('text');
              const background = label.querySelector<SVGRectElement>('rect.background');
              if (edge.label && text && background) {
                const bounds = text.getBBox();
                const height = Math.max(26, bounds.height + 8);
                background.setAttribute('x', String(bounds.x - 12));
                background.setAttribute('y', String(bounds.y - (height - bounds.height) / 2));
                background.setAttribute('width', String(bounds.width + 24));
                background.setAttribute('height', String(height));
                background.setAttribute('rx', '13');
                background.setAttribute('ry', '13');
                background.style.removeProperty('stroke');
                const finalBounds = label.getBBox();
                edge.width = finalBounds.width;
                edge.height = finalBounds.height;
                label.parentElement?.setAttribute('transform', `translate(${-finalBounds.x - finalBounds.width / 2}, ${-finalBounds.y - finalBounds.height / 2})`);
              }
              return label;
            },
            insertEdge(element: unknown, edge: MeasuredEdge, ...args) {
              const points = (edge.points ?? []).map(point => ({ ...point }));
              for (const [index, neighbor, arrow] of [[0, 1, edge.arrowTypeStart], [points.length - 1, points.length - 2, edge.arrowTypeEnd]] as const) {
                const tip = points[index], next = points[neighbor];
                if (arrow !== 'arrow_point' || !tip || !next) continue;
                const length = Math.hypot(next.x - tip.x, next.y - tip.y);
                if (!length) continue;
                const offset = Math.min(8, Math.max(0, length / 2 - 4));
                points[index] = { x: tip.x + (next.x - tip.x) * offset / length, y: tip.y + (next.y - tip.y) * offset / length };
              }
              return helpers.insertEdge(element, { ...edge, points }, ...args);
            },
          };
          // Narrow the D3 selection to the current SVG: do not mutate sibling diagrams.
          await engine.render(data, svg.selectAll(function () { return [this]; }), adapted, options);
          const root = svg.node();
          for (const marker of root?.querySelectorAll<SVGMarkerElement>('marker') ?? []) {
            const end = /-pointEnd(?:_|$)/.test(marker.id);
            const start = /-pointStart(?:_|$)/.test(marker.id);
            if (!end && !start) continue;
            marker.setAttribute('viewBox', '-5 -5 10 10');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '0'); marker.setAttribute('refY', '0');
            const path = marker.querySelector('path');
            if (!path) continue;
            path.setAttribute('d', end ? 'M -1 -3 L 3 0 L -1 3 M 3 0 L -4 0' : 'M 1 -3 L -3 0 L 1 3 M -3 0 L 4 0');
            path.setCssStyles({ fill: 'none', strokeWidth: '1', strokeDasharray: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' });
          }
        },
      };
    },
  };
}
