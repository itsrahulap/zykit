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
}
