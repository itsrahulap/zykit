// Design state, theme presets and font stacks (system fonts only: a remote font would need a
// network request, which this site's content security policy blocks).

import type { Align, SizeId } from './layout';

export type BgKind = 'solid' | 'gradient' | 'pattern';
export type PatternId = 'dots' | 'grid' | 'stripes';
export type FontId = 'sans' | 'serif' | 'mono' | 'rounded';

export interface Design {
  size: SizeId;
  title: string;
  subtitle: string;
  eyebrow: string;
  siteName: string;
  emoji: string;
  align: Align;
  font: FontId;
  theme: string;
  bgKind: BgKind;
  c1: string;
  c2: string;
  angle: number;
  pattern: PatternId;
  textColor: string;
  accent: string;
}

export const EMOJI_FALLBACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export const FONTS: { id: FontId; label: string; stack: string; weight: number }[] = [
  { id: 'sans', label: 'Sans', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', weight: 800 },
  { id: 'serif', label: 'Serif', stack: 'Georgia, "Iowan Old Style", "Times New Roman", serif', weight: 700 },
  { id: 'mono', label: 'Mono', stack: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace', weight: 700 },
  { id: 'rounded', label: 'Rounded', stack: 'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", Quicksand, system-ui, sans-serif', weight: 800 },
];
export const fontById = (id: FontId) => FONTS.find((f) => f.id === id) ?? FONTS[0];

export interface Theme {
  id: string;
  label: string;
  bgKind: BgKind;
  c1: string;
  c2: string;
  angle: number;
  pattern: PatternId;
  textColor: string;
  accent: string;
}

export const THEMES: Theme[] = [
  { id: 'zykit', label: 'Zykit paper', bgKind: 'solid', c1: '#f6f6f2', c2: '#e2e4dc', angle: 135, pattern: 'dots', textColor: '#1a221e', accent: '#2f5f4b' },
  { id: 'zykit-forest', label: 'Zykit forest', bgKind: 'gradient', c1: '#1f3e32', c2: '#0e1d17', angle: 135, pattern: 'dots', textColor: '#f6f6f2', accent: '#93b7a0' },
  { id: 'zykit-dark', label: 'Zykit dark', bgKind: 'pattern', c1: '#0f1411', c2: '#74a487', angle: 135, pattern: 'grid', textColor: '#f6f6f2', accent: '#74a487' },
  { id: 'midnight', label: 'Midnight', bgKind: 'gradient', c1: '#0f172a', c2: '#312e81', angle: 135, pattern: 'dots', textColor: '#ffffff', accent: '#a5b4fc' },
  { id: 'ocean', label: 'Ocean', bgKind: 'gradient', c1: '#0369a1', c2: '#1e3a8a', angle: 160, pattern: 'dots', textColor: '#ffffff', accent: '#bae6fd' },
  { id: 'sunset', label: 'Sunset', bgKind: 'gradient', c1: '#9a3412', c2: '#9d174d', angle: 120, pattern: 'dots', textColor: '#ffffff', accent: '#fed7aa' },
  { id: 'sand', label: 'Sand dots', bgKind: 'pattern', c1: '#fef3c7', c2: '#d97706', angle: 135, pattern: 'dots', textColor: '#451a03', accent: '#b45309' },
  { id: 'blueprint', label: 'Blueprint', bgKind: 'pattern', c1: '#1d4ed8', c2: '#ffffff', angle: 135, pattern: 'grid', textColor: '#ffffff', accent: '#bfdbfe' },
  { id: 'mono', label: 'Mono', bgKind: 'solid', c1: '#ffffff', c2: '#111111', angle: 135, pattern: 'stripes', textColor: '#111111', accent: '#525252' },
];

export const applyTheme = (d: Design, id: string): Design => {
  const t = THEMES.find((x) => x.id === id);
  if (!t) return d;
  const { label: _l, id: _i, ...rest } = t;
  void _l;
  void _i;
  return { ...d, ...rest, theme: id };
};

export const DEFAULT_DESIGN: Design = applyTheme(
  {
    size: 'og',
    title: 'Build faster with free, private developer tools',
    subtitle: 'Everything runs in your browser. Nothing is uploaded.',
    eyebrow: 'Developer tools',
    siteName: 'zykit.dev',
    emoji: '',
    align: 'left',
    font: 'sans',
    theme: 'zykit',
    bgKind: 'solid',
    c1: '#f6f6f2',
    c2: '#e2e4dc',
    angle: 135,
    pattern: 'dots',
    textColor: '#1a221e',
    accent: '#2f5f4b',
  },
  'zykit',
);

/** At most two user-perceived characters, so the emoji field can't be used to inject long text. */
export function clipEmoji(s: string): string {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(s), (x) => x.segment).slice(0, 2).join('');
  return Array.from(s).slice(0, 2).join('');
}
