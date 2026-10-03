import type { ToolDefinition } from '../types';

const imageEditor: ToolDefinition = {
  id: 'image-editor',
  name: 'Image Editor',
  tagline: 'Crop, rotate, resize and adjust images',
  description:
    'Crop, rotate, flip, resize, sharpen and adjust brightness, contrast, saturation and colour, then export as PNG, JPEG or WebP.',
  category: 'Images',
  icon: 'image',
  tags: ['Crop', 'Rotate', 'Resize', 'Adjust', 'Sharpen', 'Edit'],
  status: 'available',
  shareable: false,
  load: () => import('./ImageEditorPage'),
  docs: () => import('./docs'),
};

export default imageEditor;
