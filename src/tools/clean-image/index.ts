import type { ToolDefinition } from '../types';

const cleanImage: ToolDefinition = {
  id: 'clean-image',
  name: 'Clean Image',
  tagline: 'Inspect and remove hidden image metadata',
  description:
    'See the EXIF, GPS, XMP, IPTC, C2PA and AI-generation data inside JPEG, PNG and WebP files, then strip it without re-encoding.',
  category: 'Images',
  icon: 'shield',
  tags: ['JPEG', 'PNG', 'WebP', 'EXIF', 'Privacy'],
  status: 'available',
  load: () => import('./CleanImagePage'),
  docs: () => import('./docs'),
};

export default cleanImage;
