// Wraps every tool page: records the visit for "Recently used", tells shared components which
// tool is mounted (Send to…, share links) and renders the shared extras (related tools, Learn
// links) below the page, so individual tools don't have to.

import { useEffect, useMemo, type ComponentType } from 'react';
import { recordToolVisit } from '../shared/lib/toolPrefs';
import { ToolCtx, type ToolContextValue } from '../shared/ui/toolContext';
import type { ToolDefinition } from '../tools/types';

export interface ToolRouteProps {
  tool: ToolDefinition;
  Page: ComponentType;
  Extras: ComponentType<{ tool: ToolDefinition }>;
}

export function ToolRoute({ tool, Page, Extras }: ToolRouteProps) {
  useEffect(() => recordToolVisit(tool.id), [tool.id]);
  const ctx = useMemo<ToolContextValue>(() => ({ tool, share: { current: null } }), [tool]);
  return (
    <ToolCtx.Provider value={ctx}>
      <Page />
      <Extras tool={tool} />
    </ToolCtx.Provider>
  );
}
