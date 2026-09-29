// Which tool page is mounted, for shared pieces that need it: "Send to…" (sender id, hides the
// current tool), the share button in the breadcrumb (reads the page's shareable state).

import { createContext, useContext } from 'react';
import type { ToolDefinition } from '../../tools/types';
import type { ShareState } from '../lib/share';

export interface ToolContextValue {
  tool: ToolDefinition;
  /** Called by useShareState: registers the page's state getter; returns an unregister function. */
  registerShare: (get: () => ShareState) => () => void;
  /** The page's current shareable state, or null if the page registered none. */
  getShareState: () => ShareState | null;
}

export const ToolCtx = createContext<ToolContextValue | null>(null);

export const useCurrentTool = () => useContext(ToolCtx);
