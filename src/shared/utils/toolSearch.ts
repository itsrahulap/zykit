// Home-page tool search and category filtering. Pure functions, no DOM.

export interface SearchableTool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
}

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase();

/** Search terms: lowercase, accent-free, whitespace-separated. */
export function queryTerms(query: string): string[] {
  return fold(query).split(/\s+/).filter(Boolean);
}

/**
 * Score a tool against the query terms; 0 means no match. Every term must match
 * somewhere (name, tagline, description, tags, category or id). Name hits rank highest.
 */
export function scoreTool(tool: SearchableTool, terms: string[]): number {
  if (!terms.length) return 1;
  const name = fold(tool.name);
  const tags = tool.tags.map(fold);
  const rest = fold(`${tool.tagline} ${tool.description} ${tool.category} ${tool.id}`);
  let score = 0;
  for (const term of terms) {
    if (name.split(/\s+/).some((w) => w.startsWith(term))) score += 10;
    else if (name.includes(term)) score += 6;
    else if (tags.some((t) => t.includes(term))) score += 4;
    else if (rest.includes(term)) score += 1;
    else return 0;
  }
  return score;
}

export function filterTools<T extends SearchableTool>(tools: T[], { query = '', category = '' }: { query?: string; category?: string }): T[] {
  const terms = queryTerms(query);
  const inCategory = category ? tools.filter((t) => t.category === category) : tools;
  if (!terms.length) return inCategory;
  return inCategory
    .map((tool, i) => ({ tool, i, score: scoreTool(tool, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((r) => r.tool);
}

/** Categories in registry order with how many tools match the query in each. */
export function categoryCounts(tools: SearchableTool[], query = ''): { category: string; count: number }[] {
  const terms = queryTerms(query);
  const counts = new Map<string, number>();
  for (const t of tools) {
    if (!counts.has(t.category)) counts.set(t.category, 0);
    if (scoreTool(t, terms) > 0) counts.set(t.category, counts.get(t.category)! + 1);
  }
  return [...counts].map(([category, count]) => ({ category, count }));
}
