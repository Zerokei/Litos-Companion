import { parseDocument, stringify } from 'yaml';

type Config = Record<string, unknown>;
function record(value: unknown): Config {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Config;
}
function parse(value: string): Config {
  const document = parseDocument(value, { uniqueKeys: true });
  if (document.errors.length) throw new Error('Invalid Mermaid configuration');
  return record(document.toJS({ maxAliasCount: 20 }));
}
function merge(a: Config, b: Config): Config {
  const result = { ...a };
  for (const [key, value] of Object.entries(b)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(record(result[key]), record(value)) : value;
  }
  return result;
}

/** Only the in-memory rendering input changes. The Markdown source is never edited. */
export function prepareFlowchart(source: string): string | null {
  try {
    let body = source.replace(/^\uFEFF/, '');
    let metadata: Config = {};
    const frontmatter = /^\s*---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(body);
    if (frontmatter) {
      metadata = parse(frontmatter[1]!);
      body = body.slice(frontmatter[0].length);
    }
    let directiveConfig: Config = {};
    let unsupported = false;
    body = body.replace(/%%\{([\s\S]*?)\}%%/g, (original, directive: string) => {
      const match = /^\s*(?:init|initialize)\s*:\s*([\s\S]*)$/.exec(directive);
      if (!match) { unsupported = true; return original; }
      directiveConfig = merge(directiveConfig, parse(match[1]!));
      return '';
    });
    if (unsupported) return null;
    const significant = body.replace(/^\s*%%[^\n]*(?:\n|$)/gm, '').trimStart();
    if (!/^(?:flowchart|graph)\s+(?:TB|TD|BT|LR|RL)\b/.test(significant)) return null;
    const config = merge(directiveConfig, record(metadata.config));
    const flowchart = record(config.flowchart);
    const layout = flowchart.layout ?? config.layout ?? flowchart.defaultRenderer;
    const look = flowchart.look ?? config.look;
    if (layout !== undefined && !['elk', 'litos-flowchart'].includes(String(layout))) return null;
    if (look !== undefined && look !== 'classic') return null;
    // Preserve Obsidian's wiki-link conversion and Mermaid's HTML-label features.
    if (/\[\[|^\s*click\s/m.test(body)) return null;
    metadata.config = {
      ...config, layout: 'litos-flowchart', look: 'classic', htmlLabels: false,
      flowchart: { ...flowchart, htmlLabels: false, layout: 'litos-flowchart' },
    };
    return `---\n${stringify(metadata)}---\n${body}`;
  } catch {
    return null;
  }
}
