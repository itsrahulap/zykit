import type { ToolDefinition } from '../types';

const imageCompressor: ToolDefinition = {
  id: 'image-compressor',
  name: 'Image Compressor',
  tagline: 'Shrink JPEG, WebP and AVIF images in your browser',
  description:
    'Compress photos with a quality slider and optional max size, compare before and after, and download one file or a ZIP of the whole batch. Nothing is uploaded.',
  category: 'Images',
  icon: 'image',
  tags: ['JPEG', 'WebP', 'AVIF', 'Compress', 'Batch'],
  status: 'available',
  load: () => import('./ImageCompressorPage'),
  docs: () => import('./docs'),
};

export default imageCompressor;
