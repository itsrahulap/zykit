import type { ComponentType } from 'react';
import type { IconName } from '../shared/ui/ui';

export type ToolStatus = 'available' | 'beta' | 'coming-soon';

/** Kinds of text a tool can take as input or produce as output ("Send to…" matches on these). */
export type DataKind = 'json' | 'csv' | 'yaml' | 'xml' | 'text' | 'code' | 'sql' | 'url' | 'jwt' | 'headers' | 'markdown' | 'regex' | 'curl';

/** Everything the site needs to list, route to and load a tool. */
export interface ToolDefinition {
  /** Stable id; also the URL slug: /tools/<id> */
  id: string;
  name: string;
  /** One line shown on the tool card. */
  tagline: string;
  /** Short paragraph for the card and page metadata. */
  description: string;
  category: string;
  icon: IconName;
  tags: string[];
  status: ToolStatus;
  /** Text this tool takes into its main input via "Send to…" (see useIncomingText). */
  accepts?: DataKind[];
  /** What its main output is; the default kind for its "Send to…" menu. */
  produces?: DataKind[];
  /**
   * Offer "Copy share link" (input and options in the URL fragment). Never for tools that
   * handle secrets: tokens, keys, passwords, cookies, certificates or code.
   */
  shareable?: boolean;
  /** Lazily loaded page component, so each tool is its own code-split bundle. */
  load: () => Promise<{ default: ComponentType }>;
  /**
   * Lazily loaded user documentation (./docs.ts), rendered under the tool page and in its static
   * SEO page. Lazy so 60+ tools' docs never reach the home page bundle. Required by tests/tools/docs.test.ts.
   */
  docs?: () => Promise<{ default: ToolDocs }>;
}

/**
 * User-facing documentation for a tool. Written from the implementation, not the tool's name:
 * every limit, format and privacy statement must be true of the code. Text fields accept the
 * Learn light markup for inline `code`, **bold** and *italic*.
 */
export interface ToolDocs {
  /** 3–5 short, practical steps. */
  howToUse: string[];
  /** What actually happens: the algorithm, standard or browser API used. Paragraphs separated by a blank line. */
  howItWorks: string;
  /** Real input limits, unsupported formats and edge cases. */
  limits: string[];
  /** Where data is processed and whether anything leaves the device or is stored. */
  privacy: string;
  /** At least 3 questions specific to this tool. */
  faqs: { question: string; answer: string }[];
}
