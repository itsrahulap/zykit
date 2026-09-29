// Wraps every tool page: records the visit for "Recently used", tells shared components which
// tool is mounted (Send to…, share links) and renders the shared extras (related tools, Learn
// links) below the page, so individual tools don't have to.

import { useEffect, useMemo, useRef, type ComponentType } from 'react';
import type { ShareState } from '../shared/lib/share';
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
  const share = useRef<(() => ShareState) | null>(null);
  const ctx = useMemo<ToolContextValue>(
    () => ({
      tool,
      registerShare: (get) => {
        share.current = get;
        return () => {
          if (share.current === get) share.current = null;
        };
      },
      getShareState: () => share.current?.() ?? null,
    }),
    [tool],
  );
  return (
    <ToolCtx.Provider value={ctx}>
      <Page />
      <Extras tool={tool} />
    </ToolCtx.Provider>
  );
}
