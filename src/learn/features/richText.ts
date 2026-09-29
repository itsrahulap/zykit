// Parser for the light markup used in lesson content: blank-line separated paragraphs,
// "- " bullet lists, and inline **bold**, `code` and *italic*. Output is plain data that
// React renders as text; nothing is ever interpreted as HTML.

export type Inline = { kind: 'text' | 'bold' | 'code' | 'italic'; text: string };
export type Block = { kind: 'paragraph'; inlines: Inline[] } | { kind: 'list'; items: Inline[][] };

// Priority order: **bold**, `inline code`, *italic*.
const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

export function parseInline(line: string): Inline[] {
  return line
    .split(INLINE_PATTERN)
    .filter((part) => part !== '')
    .map((part): Inline => {
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return { kind: 'bold', text: part.slice(2, -2) };
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return { kind: 'code', text: part.slice(1, -1) };
      if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return { kind: 'italic', text: part.slice(1, -1) };
      return { kind: 'text', text: part };
    });
}

export function parseBlocks(text: string): Block[] {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block): Block => {
      const lines = block.split('\n').map((l) => l.trim());
      if (lines.every((l) => l.startsWith('- '))) return { kind: 'list', items: lines.map((l) => parseInline(l.slice(2))) };
      return { kind: 'paragraph', inlines: parseInline(lines.join(' ')) };
    });
}
