import { describe, expect, it } from 'vitest';
import { prepareFlowchart } from '../src/features/diagrams/routing';
import { parse } from 'yaml';

const elkHeader = '---\nconfig:\n  layout: elk\n---\n';

describe('flowchart routing', () => {
  it.each([
    'flowchart TD\nA --> B', 'graph LR\nA --> B', '%% 注释\nflowchart BT\nA --> B',
    'flowchart\nA --> B', 'graph\r\nA --> B',
  ])('requires explicit ELK layout: %s', source => {
    expect(prepareFlowchart(source)).toBeNull();
    expect(prepareFlowchart(elkHeader + source)).toContain('layout: litos-flowchart');
  });
  it.each([
    elkHeader + 'sequenceDiagram\nA->>B: hello', elkHeader + 'classDiagram\nA --> B', elkHeader + 'stateDiagram-v2\nA --> B',
    '---\nconfig:\n  layout: dagre\n---\nflowchart TD\nA --> B',
    '---\nconfig:\n  layout: litos-flowchart\n---\nflowchart TD\nA --> B',
    '---\nconfig:\n  layout: elk\n  look: handDrawn\n---\nflowchart TD\nA --> B',
    '---\nconfig:\n  layout: elk\n  flowchart:\n    layout: dagre\n---\nflowchart TD\nA --> B',
    "%%{init: {'flowchart': {'defaultRenderer': 'elk'}}}%%\nflowchart TD\nA --> B",
    'flowchart-elk TD\nA --> B',
    elkHeader + 'flowchart TD\nA["[[Note]]"] --> B', elkHeader + 'flowchart TD\nclick A "https://example.com"',
    elkHeader + 'flowchart TD\nA["$$x^2$$"] --> B',
    elkHeader + 'flowchart TD; A --> B; click A "https://example.com"',
    elkHeader + '%%{wrap}%%\nflowchart TD\nA --> B',
    '---\nconfig: [broken\n---\nflowchart TD\nA --> B',
  ])('leaves non-target or incompatible diagrams alone', source => {
    expect(prepareFlowchart(source)).toBeNull();
  });
  it.each([
    '---\nconfig:\n  flowchart:\n    layout: elk\n---\ngraph LR\nA --> B',
    "%%{init: {'layout': 'elk'}}%%\ngraph LR\nA --> B",
    "%%{initialize: {'flowchart': {'layout': 'elk'}}}%%\ngraph LR\nA --> B",
    "  %%{init: {\r\n    'layout': 'elk'\r\n  }}%%  \r\ngraph LR\nA --> B",
  ])('accepts explicit ELK layouts in supported configurations', source => {
    expect(prepareFlowchart(source)).toContain('layout: litos-flowchart');
  });
  it.each([
    "%% disabled: %%{init: {'layout': 'elk'}}%%\ngraph LR\nA --> B",
    "graph LR\nA[\"%%{init: {'layout': 'elk'}}%%\"] --> B",
    "graph LR\nA[\"Example:\n%%{init: {'layout': 'elk'}}%%\nend\"] --> B",
  ])('preserves directive-looking text without treating it as an opt-in', source => {
    expect(prepareFlowchart(source)).toBeNull();
    expect(prepareFlowchart(elkHeader + source)).toContain(source);
  });
  it('preserves click text inside a label and comment', () => {
    const source = 'graph LR\nA["Next; click here"] --> B\n%% Example; click B';
    expect(prepareFlowchart(elkHeader + source)).toContain(source);
  });
  it('honors the frontmatter layout when an init directive also sets layout', () => {
    const source = "---\nconfig:\n  layout: dagre\n---\n%%{init: {'layout': 'elk'}}%%\ngraph LR\nA --> B";
    expect(prepareFlowchart(source)).toBeNull();
  });
  it('preserves frontmatter, labels, styles and inline init configuration', () => {
    const source = `---\ntitle: 中文流程\nconfig:\n  layout: elk\n---\n%%{init: {'themeVariables': {'primaryColor': '#ff0000'}}}%%\nflowchart TD\nA["多行<br/>文字"] -.说明.-> B\nclassDef special fill:#abc\nclass A special`;
    const output = prepareFlowchart(source)!;
    const header = parse(output.split('---')[1]!);
    expect(header.title).toBe('中文流程');
    expect(header.config.themeVariables.primaryColor).toBe('#ff0000');
    expect(header.config.layout).toBe('litos-flowchart');
    expect(output).toContain('classDef special fill:#abc');
    expect(output).toContain('A["多行<br/>文字"] -.说明.-> B');
  });
  it('does not allow YAML prototype pollution', () => {
    prepareFlowchart('---\nconfig:\n  __proto__:\n    polluted: true\n---\nflowchart TD\nA --> B');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
