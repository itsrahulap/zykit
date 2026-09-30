import type { ToolDefinition } from '../types';

const colorConverter: ToolDefinition = {
  id: 'color-converter',
  name: 'Color Converter',
  tagline: 'HEX, RGB, HSL, OKLCH and contrast checks',
  description:
    'Convert colours between HEX, RGB, HSL, HWB, OKLCH and more, check WCAG contrast, and build palettes with colour-blindness previews.',
  category: 'Developer',
  icon: 'sparkle',
  tags: ['Color', 'HEX', 'OKLCH', 'Contrast', 'WCAG'],
  status: 'available',
  load: () => import('./ColorConverterPage'),
};

export default colorConverter;
