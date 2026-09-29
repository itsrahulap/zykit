// Wraps every tool page: records the visit for "Recently used" and renders the shared extras
// (related tools, Learn links) below the page, so individual tools don't have to.

import { useEffect, type ComponentType } from 'react';
import { recordToolVisit } from '../shared/lib/toolPrefs';
import type { ToolDefinition } from '../tools/types';

export interface ToolRouteProps {
  tool: ToolDefinition;
  Page: ComponentType;
  Extras: ComponentType<{ tool: ToolDefinition }>;
}

export function ToolRoute({ tool, Page, Extras }: ToolRouteProps) {
  useEffect(() => recordToolVisit(tool.id), [tool.id]);
  return (
    <>
      <Page />
      <Extras tool={tool} />
    </>
  );
}
