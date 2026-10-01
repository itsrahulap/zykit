import type { ToolDefinition } from '../types';

const imageBase64: ToolDefinition = {
  id: 'image-base64',
  name: 'Image to Base64',
  tagline: 'Encode images as Base64 data URIs and decode them back',
  description:
    'Turn an image into a Base64 data URI, CSS background or HTML img tag, or paste Base64 to preview and download the image. The file type is detected from its bytes.',
  category: 'Images',
  icon: 'code',
  tags: ['Base64', 'Data URI', 'CSS', 'HTML'],
  status: 'available',
  load: () => import('./ImageBase64Page'),
  docs: () => import('./docs'),
};

export default imageBase64;
