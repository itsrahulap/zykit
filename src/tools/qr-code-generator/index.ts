import type { ToolDefinition } from '../types';

const qrCodeGenerator: ToolDefinition = {
  id: 'qr-code-generator',
  name: 'QR Code Generator',
  tagline: 'Create QR codes for links, Wi-Fi and contacts',
  description:
    'Generate QR codes for URLs, text, Wi-Fi logins, email and contact cards, and download them as PNG or SVG.',
  category: 'Web',
  icon: 'grid',
  tags: ['QR code', 'Wi-Fi', 'vCard'],
  status: 'available',
  accepts: ['text', 'url'],
  shareable: true,
  load: () => import('./QrCodeGeneratorPage'),
};

export default qrCodeGenerator;
