// Shapes for blog posts. A post is plain data (sections of typed blocks), so the React page and the
// build step that writes static HTML (scripts/seo-plugin.ts) render the same content.
// Text fields use the Learn light markup: blank-line paragraphs, "- " bullets, **bold**, `code`, *italic*.

export type PostBlock =
  | { type: 'text'; text: string }
  | { type: 'code'; code: string; caption?: string }
  /** Commands shown with a toggle between the Claude Code chat and a shell. */
  | { type: 'commands'; chat: string[]; shell: string[] }
  /** Example things to type to Claude. */
  | { type: 'prompts'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'warn'; title?: string; text: string }
  | { type: 'cards'; items: { title: string; text: string }[] }
  | { type: 'steps'; items: { title: string; text: string }[] }
  /** Cards linking to other posts, by slug. */
  | { type: 'posts'; slugs: string[] };

export interface PostSection {
  heading: string;
  blocks: PostBlock[];
}

export interface BlogSeries {
  id: string;
  title: string;
  description: string;
}

export interface BlogPost {
  /** URL: /blog/<slug> */
  slug: string;
  title: string;
  /** One or two sentences for the post list, meta description and link previews. */
  summary: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tags: string[];
  /** Series id; posts in a series are ordered as they appear in the registry. */
  series?: string;
  /** Opening paragraph(s) before the first section. */
  intro: string;
  sections: PostSection[];
}
