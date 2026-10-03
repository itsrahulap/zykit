import type { ToolDefinition } from '../types';

const textEncryption: ToolDefinition = {
  id: 'text-encryption',
  name: 'Encrypt / Decrypt Text',
  tagline: 'Encrypt text with a passphrase (AES-GCM)',
  description:
    'Encrypt and decrypt text with a passphrase using AES-256-GCM and PBKDF2 in your browser, to share secrets safely.',
  category: 'Security',
  icon: 'lock',
  tags: ['AES', 'Encryption', 'Passphrase'],
  status: 'available',
  accepts: ['text'],
  produces: ['text'],
  shareable: false,
  load: () => import('./TextEncryptionPage'),
  docs: () => import('./docs'),
};

export default textEncryption;
