// Context for the site-wide command palette (provided by CommandPaletteProvider).

import { createContext, useContext } from 'react';

export interface PaletteContext {
  open: () => void;
  isOpen: boolean;
  /** How many times the palette has been opened; lets other overlays close when it opens. */
  opens: number;
}
export const PaletteCtx = createContext<PaletteContext>({ open: () => {}, isOpen: false, opens: 0 });

export const useCommandPalette = () => useContext(PaletteCtx);

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const shortcutLabel = () => (isMac() ? '⌘K' : 'Ctrl K');
