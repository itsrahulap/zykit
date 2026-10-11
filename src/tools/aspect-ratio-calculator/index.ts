import type { ToolDefinition } from '../types';

const aspectRatioCalculator: ToolDefinition = {
  id: 'aspect-ratio-calculator',
  name: 'Aspect Ratio Calculator',
  tagline: 'Work out sizes that keep the same ratio',
  description:
    'Find the aspect ratio of any width and height, scale dimensions without distortion, and use common presets like 16:9 and 4:3.',
  category: 'Converters',
  icon: 'grid',
  tags: ['Aspect ratio', 'Resolution', '16:9'],
  status: 'available',
  shareable: true,
  load: () => import('./AspectRatioCalculatorPage'),
  docs: () => import('./docs'),
};

export default aspectRatioCalculator;
