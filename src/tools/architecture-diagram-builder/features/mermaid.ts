// Mermaid flowchart export. Node ids are generated (n1, n2, …) so imported ids or reserved words
// like "end" never reach Mermaid; labels are always quoted and entity-escaped.

import { groupMembers, type Diagram, type NodeKind } from './model';

/**
 * Escapes a label for a quoted Mermaid string. Characters that end a string, a shape or an edge
 * label (quotes, brackets, pipes, …) become Mermaid's numeric entities (`#34;`); newlines become `<br/>`.
 */
export function escapeMermaidLabel(label: string): string {
  return label
    .replace(/[#"|[\]{}()<>&;`]/g, (c) => `#${c.charCodeAt(0)};`)
    .replace(/\r\n?|\n/g, '<br/>')
    // oxlint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ');
}

const SHAPES: Record<NodeKind, [string, string]> = {
  frontend: ['[', ']'],
  service: ['(', ')'],
  database: ['[(', ')]'],
  cache: ['{{', '}}'],
  queue: ['[[', ']]'],
  external: ['[/', '/]'],
  generic: ['[', ']'],
};

export function toMermaid(d: Diagram, direction: 'LR' | 'TB' = 'LR'): string {
  const ids = new Map(d.nodes.map((n, i) => [n.id, `n${i + 1}`]));
  const lines = [`flowchart ${direction}`];
  const nodeLine = (id: string, indent: string) => {
    const n = d.nodes.find((x) => x.id === id)!;
    const [open, close] = SHAPES[n.kind];
    return `${indent}${ids.get(n.id)}${open}"${escapeMermaidLabel(n.label || ' ')}"${close}`;
  };

  // Groups don't nest in this editor, so a node goes into the smallest group that contains it.
  const owner = new Map<string, string>();
  const bySize = [...d.groups].sort((a, b) => a.width * a.height - b.width * b.height);
  for (const g of bySize) for (const n of groupMembers(d, g)) if (!owner.has(n.id)) owner.set(n.id, g.id);

  d.groups.forEach((g, i) => {
    const members = d.nodes.filter((n) => owner.get(n.id) === g.id);
    lines.push(`  subgraph g${i + 1}["${escapeMermaidLabel(g.label || ' ')}"]`);
    for (const n of members) lines.push(nodeLine(n.id, '    '));
    lines.push('  end');
  });
  for (const n of d.nodes) if (!owner.has(n.id)) lines.push(nodeLine(n.id, '  '));

  for (const e of d.edges) {
    const from = ids.get(e.from);
    const to = ids.get(e.to);
    if (!from || !to) continue;
    lines.push(e.label ? `  ${from} -->|"${escapeMermaidLabel(e.label)}"| ${to}` : `  ${from} --> ${to}`);
  }
  return `${lines.join('\n')}\n`;
}
