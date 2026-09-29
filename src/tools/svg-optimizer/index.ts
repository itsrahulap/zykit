import type { ToolDefinition } from '../types';

const svgOptimizer: ToolDefinition = {
  id: 'svg-optimizer',
  name: 'SVG Optimizer',
  tagline: 'Minify and sanitize SVG files',
  description:
    'Strip editor metadata, comments and default attributes, round path numbers and remove scripts and event handlers from SVGs. Preview safely and compare sizes.',
  category: 'Images',
  icon: 'sparkle',
  tags: ['SVG', 'Minify', 'Sanitize', 'Inkscape', 'Illustrator', 'Figma'],
  status: 'available',
  load: () => import('./SvgOptimizerPage'),
};

export default svgOptimizer;
