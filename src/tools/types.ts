import type { ComponentType } from 'react';
import type { IconName } from '../shared/ui/ui';

export type ToolStatus = 'available' | 'beta' | 'coming-soon';

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
  /** Lazily loaded page component, so each tool is its own code-split bundle. */
  load: () => Promise<{ default: ComponentType }>;
}
