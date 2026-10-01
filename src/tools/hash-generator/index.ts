import type { ToolDefinition } from '../types';

const hashGenerator: ToolDefinition = {
  id: 'hash-generator',
  name: 'Hash Generator',
  tagline: 'MD5, SHA and HMAC of any text',
  description:
    'Compute MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes, or HMACs with a secret key, as you type.',
  category: 'Developer',
  icon: 'hash',
  tags: ['MD5', 'SHA-256', 'SHA-512', 'HMAC'],
  status: 'available',
  accepts: ['text'],
  load: () => import('./HashGeneratorPage'),
  docs: () => import('./docs'),
};

export default hashGenerator;
