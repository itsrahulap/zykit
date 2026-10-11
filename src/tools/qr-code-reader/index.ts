import type { ToolDefinition } from '../types';

const qrCodeReader: ToolDefinition = {
  id: 'qr-code-reader',
  name: 'QR Code Reader',
  tagline: 'Read QR codes from images',
  description:
    'Decode QR codes from an image, screenshot or paste and see the content, with links and Wi-Fi details shown safely.',
  category: 'Images',
  icon: 'grid',
  tags: ['QR code', 'Scanner', 'Decode'],
  status: 'available',
  shareable: false,
  load: () => import('./QrCodeReaderPage'),
  docs: () => import('./docs'),
};

export default qrCodeReader;
