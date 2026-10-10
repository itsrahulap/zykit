import type { ToolDefinition } from '../types';

const imageDiff: ToolDefinition = {
  id: 'image-diff',
  name: 'Image Diff',
  tagline: 'Compare two images and see what changed',
  description:
    'Compare two images side by side, with a slider, onion skin, blink or a difference heatmap. Set a tolerance, ignore anti-aliasing, see the changed pixel count and download the diff as PNG. Nothing is uploaded.',
  category: 'Images',
  icon: 'diff',
  tags: ['Image', 'Diff', 'Compare', 'Visual regression'],
  status: 'available',
  shareable: false,
  load: () => import('./ImageDiffPage'),
  docs: () => import('./docs'),
};

export default imageDiff;
