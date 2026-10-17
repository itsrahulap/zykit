import type { ToolDefinition } from '../types';

const svgOptimizer: ToolDefinition = {
  id: 'svg-optimizer',
  name: 'SVG Optimizer',
  tagline: 'Minify and sanitize SVG files',
  description:
    'Optimize SVGs: strip editor metadata, comments and default attributes, round numbers, and remove scripts and event handlers. Preview safely and compare sizes.',
  category: 'Images',
  icon: 'sparkle',
  tags: ['SVG', 'Minify', 'Sanitize', 'Inkscape', 'Illustrator', 'Figma'],
  status: 'available',
  load: () => import('./SvgOptimizerPage'),
  docs: () => import('./docs'),
};

export default svgOptimizer;
