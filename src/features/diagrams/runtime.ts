import type { Mermaid, RenderResult } from 'mermaid';
import { readPalette } from '../../theme/bridge';
import { RenderQueue } from './queue';
import { createLitosLayout } from './layout';
import { diagramCSS } from './style';
import { decorateSvg } from './svg';

export class DiagramRuntime {
  private mermaid?: Promise<Mermaid>;
  private queue = new RenderQueue();
  private alive = true;

  private load(): Promise<Mermaid> {
    if (!this.mermaid) {
      this.mermaid = Promise.all([import('mermaid'), import('@mermaid-js/layout-elk')]).then(([{ default: mermaid }, { default: layouts }]) => {
        const elk = layouts.find(layout => layout.name === 'elk');
        if (!elk) throw new Error('ELK loader unavailable');
        mermaid.registerLayoutLoaders([...layouts, createLitosLayout(elk)]);
        return mermaid;
      });
    }
    return this.mermaid;
  }
  render(id: string, source: string, container?: Element): Promise<RenderResult | null> {
    return this.queue.run(async () => {
      if (!this.alive) return null;
      const mermaid = await this.load();
      if (!this.alive) return null;
      const targetDocument = container?.ownerDocument ?? document;
      const palette = readPalette(targetDocument);
      // Mermaid measures in its own realm's document. Keep a private connected sandbox,
      // and return the SVG to Obsidian so popout windows keep the normal insertion path.
      const stage = document.body.createDiv();
      stage.setCssStyles({ position: 'absolute', left: '-100000px', top: '0', visibility: 'hidden', pointerEvents: 'none',
        width: `${container?.getBoundingClientRect().width || 800}px` });
      try {
        await document.fonts?.ready;
        mermaid.initialize({
          startOnLoad: false, suppressErrorRendering: true, securityLevel: 'strict',
          theme: 'base', layout: 'litos-flowchart', look: 'classic', htmlLabels: false,
          fontFamily: palette.font,
          themeVariables: {
            darkMode: palette.dark, background: palette.surface, fontFamily: palette.font,
            fontSize: '14px', primaryColor: palette.node, primaryTextColor: palette.text,
            primaryBorderColor: palette.border, secondaryColor: palette.label,
            secondaryTextColor: palette.text, tertiaryColor: palette.surface,
            tertiaryTextColor: palette.text, tertiaryBorderColor: palette.border,
            lineColor: palette.line, textColor: palette.text, nodeTextColor: palette.text,
            mainBkg: palette.node, nodeBorder: palette.border, clusterBkg: palette.surface,
            clusterBorder: palette.border, edgeLabelBackground: palette.label,
          },
          themeCSS: diagramCSS(palette),
          flowchart: { htmlLabels: false, useMaxWidth: true, curve: 'basis', nodeSpacing: 40, rankSpacing: 50 },
        });
        const result = await mermaid.render(id, source, stage);
        if (!this.alive) return null;
        return { ...result, svg: decorateSvg(result.svg) };
      } finally { stage.remove(); }
    });
  }
  dispose(): void { this.alive = false; }
}
