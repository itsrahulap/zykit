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

/** Words people use for the same need. A term in a group also finds tools matching the other words, ranked lower. */
const RELATED = [
  ['api', 'http', 'request', 'rest', 'endpoint', 'curl', 'fetch', 'webhook', 'graphql', 'openapi', 'postman', 'status code'],
  ['image', 'photo', 'picture', 'img', 'png', 'jpeg', 'jpg', 'webp'],
  ['pdf', 'document'],
  ['password', 'secret', 'credential', 'hash', 'encrypt', 'bcrypt'],
  ['auth', 'token', 'jwt', 'bearer', 'oauth', 'totp', '2fa', 'otp'],
  ['time', 'date', 'timestamp', 'timezone', 'epoch', 'unix', 'clock'],
  ['encode', 'decode', 'base64', 'escape', 'percent-encoding'],
  ['format', 'beautify', 'prettify', 'pretty', 'indent', 'minify'],
  ['color', 'colour', 'palette', 'hex', 'rgb'],
  ['compare', 'diff', 'difference'],
  ['regex', 'regexp', 'pattern'],
  ['network', 'ip', 'cidr', 'subnet', 'dns'],
  ['email', 'mail', 'smtp', 'dkim', 'spf'],
  ['docker', 'container', 'kubernetes', 'k8s', 'compose', 'devops'],
  ['seo', 'meta tag', 'sitemap', 'robots', 'open graph'],
  ['sql', 'database', 'postgres', 'query', 'db'],
  ['random', 'generate', 'generator', 'mock', 'fake'],
  ['qr', 'barcode'],
];

/** The other words in any group that contains the term (or a word the term starts, e.g. "pho" → photo). */
function relatedTerms(term: string): string[] {
  const out = new Set<string>();
  for (const group of RELATED) if (group.some((w) => w === term || (term.length >= 3 && w.startsWith(term)))) group.forEach((w) => out.add(w));
  out.delete(term);
  return [...out];
}

/**
 * Score a tool against the query terms; 0 means no match. Every term must match
 * somewhere (name, tagline, description, tags, category or id), directly or through a
 * related word. Name hits rank highest; related-word hits rank below any direct hit.
 */
export function scoreTool(tool: SearchableTool, terms: string[]): number {
  if (!terms.length) return 1;
  const name = fold(tool.name);
  const tags = tool.tags.map(fold);
  const rest = fold(`${tool.tagline} ${tool.description} ${tool.category} ${tool.id}`);
  const direct = (term: string) =>
    name.split(/\s+/).some((w) => w.startsWith(term)) ? 20 : name.includes(term) ? 12 : tags.some((t) => t.includes(term)) ? 8 : rest.includes(term) ? 2 : 0;
  // Related words match whole-word starts only, so "rest" doesn't hit "interest".
  const all = `${name} ${tags.join(' ')} ${rest}`;
  const related = (r: string) => new RegExp(`(^|[^a-z0-9])${r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(all);
  let score = 0;
  for (const term of terms) {
    const s = direct(term) || (relatedTerms(term).some(related) ? 1 : 0);
    if (!s) return 0;
    score += s;
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
