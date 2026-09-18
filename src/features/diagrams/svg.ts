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
