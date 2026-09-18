import { describe, expect, it } from 'vitest';
import { prepareFlowchart } from '../src/features/diagrams/routing';
import { parse } from 'yaml';
describe('flowchart routing', () => {
  it.each(['flowchart TD\nA --> B', 'graph LR\nA --> B', '%% 注释\nflowchart BT\nA --> B'])('enhances ordinary flowcharts: %s', source => {
    expect(prepareFlowchart(source)).toContain('layout: litos-flowchart');
  });
  it.each([
    'sequenceDiagram\nA->>B: hello', 'classDiagram\nA --> B', 'stateDiagram-v2\nA --> B',
    '---\nconfig:\n  layout: dagre\n---\nflowchart TD\nA --> B',
    '---\nconfig:\n  look: handDrawn\n---\nflowchart TD\nA --> B',
    "%%{init: {'flowchart': {'defaultRenderer': 'dagre'}}}%%\nflowchart TD\nA --> B",
    'flowchart TD\nA["[[Note]]"] --> B', 'flowchart TD\nclick A "https://example.com"',
    '---\nconfig: [broken\n---\nflowchart TD\nA --> B',
  ])('leaves non-target or incompatible diagrams alone', source => {
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
