import type { ToolDefinition } from '../types';

const colorPaletteExtractor: ToolDefinition = {
  id: 'color-palette-extractor',
  name: 'Color Palette Extractor',
  tagline: 'Pull the dominant colours out of any image',
  description:
    'Extract 3 to 12 dominant colours from an image with k-means in OKLab or median cut, see each colour’s share and WCAG contrast, and copy them as CSS variables, SCSS, a Tailwind theme or JSON.',
  category: 'Images',
  icon: 'sparkle',
  tags: ['Color', 'Palette', 'k-means', 'OKLCH', 'Tailwind'],
  status: 'available',
  shareable: false,
  load: () => import('./ColorPaletteExtractorPage'),
  docs: () => import('./docs'),
};

export default colorPaletteExtractor;
