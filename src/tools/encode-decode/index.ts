import type { ToolDefinition } from '../types';

const encodeDecode: ToolDefinition = {
  id: 'encode-decode',
  name: 'Encode / Decode',
  tagline: 'Base64, URL, HTML entity and hex',
  description:
    'Convert text to and from Base64, Base64URL, URL encoding, HTML entities and hex, with full Unicode support.',
  category: 'Developer',
  icon: 'swap',
  tags: ['Base64', 'URL', 'HTML', 'Hex'],
  status: 'available',
  load: () => import('./EncodeDecodePage'),
};

export default encodeDecode;
