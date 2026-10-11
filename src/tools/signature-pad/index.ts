import type { ToolDefinition } from '../types';

const signaturePad: ToolDefinition = {
  id: 'signature-pad',
  name: 'Signature Pad',
  tagline: 'Draw a signature as a transparent PNG',
  description:
    'Draw or type your signature and download it as a transparent PNG or SVG to place on documents.',
  category: 'Images',
  icon: 'image',
  tags: ['Signature', 'PNG', 'Sign'],
  status: 'available',
  shareable: false,
  load: () => import('./SignaturePadPage'),
  docs: () => import('./docs'),
};

export default signaturePad;
