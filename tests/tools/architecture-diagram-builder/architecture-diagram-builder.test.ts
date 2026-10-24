import { describe, expect, it } from 'vitest';
import {
  addEdge,
  addNode,
  commit,
  createHistory,
  deleteItem,
  moveItem,
  preview,
  redo,
  undo,
  updateNode,
} from '../../../src/tools/architecture-diagram-builder/features/diagram';
import { escapeMermaidLabel, toMermaid } from '../../../src/tools/architecture-diagram-builder/features/mermaid';
import { LIMITS, NODE_HEIGHT, NODE_WIDTH, fitView, wrapLabel, type Diagram } from '../../../src/tools/architecture-diagram-builder/features/model';
import { SAMPLES } from '../../../src/tools/architecture-diagram-builder/features/samples';
import { importDiagram, parseDiagram, serializeDiagram, toFile } from '../../../src/tools/architecture-diagram-builder/features/serialize';
import { toSvg } from '../../../src/tools/architecture-diagram-builder/features/svgExport';

const webApp = SAMPLES[0].diagram;
const file = (patch: Record<string, unknown>) => ({ ...toFile(webApp), ...patch });

describe('serialization', () => {
  it('round-trips every sample', () => {
    for (const s of SAMPLES) expect(importDiagram(serializeDiagram(s.diagram))).toEqual(s.diagram);
  });

  it('rejects files that are not diagrams', () => {
    expect(() => importDiagram('{nope')).toThrow(/Not valid JSON \(line 1/);
    expect(() => parseDiagram([])).toThrow(/expected a JSON object/);
    expect(() => parseDiagram(file({ format: 'other' }))).toThrow(/format/);
    expect(() => parseDiagram(file({ version: 2 }))).toThrow(/version/);
  });

  it('validates every field of hostile input', () => {
    const node = webApp.nodes[0];
    expect(() => parseDiagram(file({ nodes: [{ ...node, kind: 'script' }] }))).toThrow(/unknown kind/);
    expect(() => parseDiagram(file({ nodes: [{ ...node, id: '<img src=x onerror=alert(1)>' }], edges: [] }))).toThrow(/id/);
    expect(() => parseDiagram(file({ nodes: [{ ...node, x: '1e999' }], edges: [] }))).toThrow(/numeric/);
    expect(() => parseDiagram(file({ nodes: [{ ...node, label: { toString: 1 } }], edges: [] }))).toThrow(/isn't text/);
    expect(() => parseDiagram(file({ nodes: [{ ...node, label: 'x'.repeat(LIMITS.label + 1) }], edges: [] }))).toThrow(/longer than/);
    expect(() => parseDiagram(file({ nodes: [node, node], edges: [] }))).toThrow(/used twice/);
    expect(() => parseDiagram(file({ edges: [{ id: 'e', from: 'node-1', to: 'ghost', label: '' }] }))).toThrow(/doesn't exist/);
    expect(() => parseDiagram(file({ edges: [{ id: 'e', from: 'node-1', to: 'node-1' }] }))).toThrow(/itself/);
    expect(() => parseDiagram(file({ groups: [{ id: 'g', label: '', x: 0, y: 0, width: 5, height: 5 }] }))).toThrow(/between/);
    expect(() => parseDiagram(file({ nodes: 'lots' }))).toThrow(/must be a list/);
  });

  it('caps node counts and clamps coordinates', () => {
    const many = Array.from({ length: LIMITS.nodes + 1 }, (_, i) => ({ id: `n${i}`, kind: 'service', label: '', x: 0, y: 0 }));
    expect(() => parseDiagram(file({ nodes: many, edges: [], groups: [] }))).toThrow(/Too many nodes/);
    const far = parseDiagram(file({ nodes: [{ id: 'a', kind: 'cache', x: 1e12, y: -1e12 }], edges: [], groups: [] }));
    expect(far.nodes[0]).toEqual({ id: 'a', kind: 'cache', label: '', x: LIMITS.coordinate, y: -LIMITS.coordinate });
  });

  it('drops unknown fields and keeps markup as plain label text', () => {
    const d = parseDiagram(file({ nodes: [{ id: 'a', kind: 'generic', label: '<script>x</script>', x: 0, y: 0, onclick: 'x', __proto__: { evil: 1 } }], edges: [], groups: [] }));
    expect(d.nodes[0]).toEqual({ id: 'a', kind: 'generic', label: '<script>x</script>', x: 0, y: 0 });
    expect(toSvg(d).svg).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(toSvg(d).svg).not.toContain('<script>');
  });
});

describe('Mermaid export', () => {
  it('escapes quotes, brackets, pipes and newlines', () => {
    expect(escapeMermaidLabel('say "hi" [x] {y} (z) a|b')).toBe('say #34;hi#34; #91;x#93; #123;y#125; #40;z#41; a#124;b');
    expect(escapeMermaidLabel('line 1\nline 2')).toBe('line 1<br/>line 2');
    expect(escapeMermaidLabel('<b>&#;')).toBe('#60;b#62;#38;#35;#59;');
  });

  it('uses generated ids, shapes per kind, subgraphs and labelled edges', () => {
    const d: Diagram = {
      nodes: [
        { id: 'end', kind: 'database', label: 'DB "main"', x: 0, y: 0 },
        { id: 'b', kind: 'service', label: 'API|v2', x: 300, y: 0 },
      ],
      edges: [{ id: 'e', from: 'b', to: 'end', label: 'reads [rows]' }],
      groups: [{ id: 'g', label: 'VPC', x: -20, y: -20, width: 200, height: 120 }],
    };
    expect(toMermaid(d)).toBe(
      ['flowchart LR', '  subgraph g1["VPC"]', '    n1[("DB #34;main#34;")]', '  end', '  n2("API#124;v2")', '  n2 -->|"reads #91;rows#93;"| n1', ''].join('\n'),
    );
  });
});

describe('editing and history', () => {
  it('undoes and redoes, and a new edit clears the redo stack', () => {
    let h = createHistory(webApp);
    h = commit(h, updateNode(h.present, 'node-1', { label: 'One' }));
    h = commit(h, updateNode(h.present, 'node-1', { label: 'Two' }));
    h = undo(h);
    expect(h.present.nodes[0].label).toBe('One');
    h = redo(h);
    expect(h.present.nodes[0].label).toBe('Two');
    h = undo(undo(h));
    expect(h.present).toBe(webApp);
    expect(undo(h)).toBe(h);
    h = commit(h, updateNode(h.present, 'node-1', { label: 'Three' }));
    expect(h.future).toEqual([]);
  });

  it('turns a whole drag into one undo step', () => {
    let h = createHistory(webApp);
    const base = h.present;
    h = preview(h, moveItem(base, { type: 'node', id: 'node-1' }, 5, 5));
    const done = moveItem(base, { type: 'node', id: 'node-1' }, 40, 10);
    h = commit(preview(h, done), done, base);
    expect(h.past).toEqual([base]);
    expect(undo(h).present.nodes[0]).toMatchObject({ x: base.nodes[0].x, y: base.nodes[0].y });
  });

  it('moves a group together with the nodes inside it', () => {
    const moved = moveItem(webApp, { type: 'group', id: 'group-1' }, 100, -10);
    expect(moved.groups[0]).toMatchObject({ x: webApp.groups[0].x + 100, y: webApp.groups[0].y - 10 });
    const by = (d: Diagram, id: string) => d.nodes.find((n) => n.id === id)!;
    expect(by(moved, 'node-2').x).toBe(by(webApp, 'node-2').x + 100); // inside
    expect(by(moved, 'node-1').x).toBe(by(webApp, 'node-1').x); // outside
    expect(by(moved, 'node-5').x).toBe(by(webApp, 'node-5').x); // outside
  });

  it('deleting a node removes the edges attached to it', () => {
    const d = deleteItem(webApp, { type: 'node', id: 'node-2' });
    expect(d.nodes.some((n) => n.id === 'node-2')).toBe(false);
    expect(d.edges.every((e) => e.from !== 'node-2' && e.to !== 'node-2')).toBe(true);
    expect(d.edges).toHaveLength(0);
  });

  it('adds nodes and edges, refusing self-loops and duplicates', () => {
    const { diagram, id } = addNode(webApp, 'queue', 'Jobs\u0000', 0, 0);
    expect(diagram.nodes.at(-1)).toMatchObject({ id: 'node-7', label: 'Jobs ' });
    expect(addEdge(diagram, id, id)).toBeNull();
    expect(addEdge(diagram, 'node-1', 'node-2')).toBeNull();
    expect(addEdge(diagram, id, 'node-1')!.diagram.edges.at(-1)).toMatchObject({ from: id, to: 'node-1' });
  });
});

describe('geometry', () => {
  it('fits the diagram centred in the viewport', () => {
    const d: Diagram = { nodes: [{ id: 'a', kind: 'generic', label: '', x: 100, y: 100 }, { id: 'b', kind: 'generic', label: '', x: 1050, y: 100 }], edges: [], groups: [] };
    // content is 1100 × 64; viewport 600 wide with 24 px padding → zoom 552/1100
    const v = fitView(d, 600, 400);
    expect(v.zoom).toBeCloseTo(552 / 1100);
    expect(100 * v.zoom + v.x).toBeCloseTo(24); // left edge lands on the padding
    expect(100 * v.zoom + v.y + (NODE_HEIGHT * v.zoom) / 2).toBeCloseTo(200); // vertically centred
    expect(fitView({ nodes: [], edges: [], groups: [] }, 600, 400)).toEqual({ x: 0, y: 0, zoom: 1 });
    // small diagrams are not blown up past 100%
    expect(fitView({ ...d, nodes: d.nodes.slice(0, 1) }, 600, 400)).toEqual({ x: 300 - NODE_WIDTH / 2 - 100, y: 200 - NODE_HEIGHT / 2 - 100, zoom: 1 });
  });

  it('wraps long labels into two lines with an ellipsis', () => {
    expect(wrapLabel('Payment provider')).toEqual(['Payment provider']);
    expect(wrapLabel('A very long label that keeps going and going')).toEqual(['A very long label', 'that keeps going…']);
  });
});
