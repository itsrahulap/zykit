import type { ToolDefinition } from '../types';

const imageDiff: ToolDefinition = {
  id: 'image-diff',
  name: 'Image Diff',
  tagline: 'Compare two images pixel by pixel',
  description:
    'Overlay, slide or highlight the differences between two images, with a changed-pixel count and a tolerance setting.',
  category: 'Images',
  icon: 'diff',
  tags: ['Diff', 'Compare', 'Image'],
  status: 'available',
  load: () => import('./ImageDiffPage'),
  docs: () => import('./docs'),
};

export default imageDiff;
