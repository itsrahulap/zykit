// Switchable visual design styles. Each one is a block of token overrides in styles/index.css,
// keyed on <html data-design="…">; "default" sets no attribute. Independent of light/dark.

export type DesignStyle = 'default' | 'minimal' | 'neo-brutalism' | 'brutalism' | 'bento' | 'neumorphism';
const KEY = 'zykit-design';

/** Order here is the order shown in the style menu. */
export const DESIGN_STYLES: { id: DesignStyle; label: string; description: string }[] = [
  { id: 'default', label: 'Default', description: 'Restrained, developer-focused' },
  { id: 'minimal', label: 'Minimal', description: 'Flat and quiet, no shadows' },
  { id: 'neo-brutalism', label: 'Neo-Brutalism', description: 'Thick borders, hard shadows' },
  { id: 'brutalism', label: 'Brutalism', description: 'Raw, undesigned, monospace' },
  { id: 'bento', label: 'Bento', description: 'Rounded cards, soft shadows' },
  { id: 'neumorphism', label: 'Neumorphism', description: 'Soft extruded surfaces' },
];

export function getStoredDesign(): DesignStyle {
  try {
    const stored = localStorage.getItem(KEY);
    if (DESIGN_STYLES.some((s) => s.id === stored)) return stored as DesignStyle;
  } catch {
    // Storage unavailable; use the default style.
  }
  return 'default';
}

export const currentDesign = (): DesignStyle => (document.documentElement.dataset.design as DesignStyle | undefined) ?? 'default';

export function applyDesign(style: DesignStyle, persist = true) {
  if (style === 'default') delete document.documentElement.dataset.design;
  else document.documentElement.dataset.design = style;
  if (!persist) return;
  try {
    localStorage.setItem(KEY, style);
  } catch {
    // Storage unavailable (private mode); the choice just won't persist.
  }
}
