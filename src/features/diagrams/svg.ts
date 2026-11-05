const presentation = [
  'color', 'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'font-family',
  'font-size', 'font-style', 'font-weight', 'text-anchor', 'dominant-baseline', 'rx', 'ry',
] as const;

/** Pele's note sanitizer removes stylesheets. Preserve their SVG presentation
 * while Mermaid's measured diagram is still connected to the staging document. */
export function preserveSvgPresentation(svg: Element): void {
  const sheets = svg.querySelectorAll('style');
  const win = svg.ownerDocument.defaultView;
  if (!sheets.length || !win) return;
  const elements = [svg, ...svg.querySelectorAll('g, text, tspan, rect, path, circle, ellipse, polygon, polyline, line')];
  const before = elements.map(element => {
    const style = win.getComputedStyle(element);
    return presentation.map(property => style.getPropertyValue(property));
  });
  for (const sheet of sheets) sheet.remove();
  // Read the cascade before writing attributes, including on parent groups.
  const changes: Array<[Element, string, string]> = [];
  elements.forEach((element, index) => {
    const style = win.getComputedStyle(element);
    presentation.forEach((property, column) => {
      const value = before[index]![column]!;
      if (value && value !== style.getPropertyValue(property) && !value.includes('url(')) {
        changes.push([element, property, value]);
      }
    });
  });
  for (const [element, property, value] of changes) element.setAttribute(property, value);
}

/** Decorate strict-mode Mermaid output in an inert XML document, never live HTML. */
export function decorateSvg(source: string): string {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = parsed.documentElement;
  if (parsed.querySelector('parsererror') || root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg') {
    throw new Error('Mermaid did not return valid SVG');
  }
  // Mermaid rewrites the root class after layout, so this must happen after render.
  root.classList.add('litos-companion-diagram');
  root.setAttribute('data-litos-layout', 'elk');
  return new XMLSerializer().serializeToString(root);
}
