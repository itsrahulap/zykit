import type { ToolDefinition } from '../types';

const colorPaletteExtractor: ToolDefinition = {
  id: 'color-palette-extractor',
  name: 'Color Palette Extractor',
  tagline: 'Pull the dominant colours out of any image',
  description:
    'Extract 3 to 12 dominant colours from an image, see each one’s share and WCAG contrast, and export them as CSS variables, SCSS, Tailwind or JSON.',
  category: 'Images',
  icon: 'sparkle',
  tags: ['Color', 'Palette', 'k-means', 'OKLCH', 'Tailwind'],
  status: 'available',
  shareable: false,
  load: () => import('./ColorPaletteExtractorPage'),
  docs: () => import('./docs'),
};

export default colorPaletteExtractor;
