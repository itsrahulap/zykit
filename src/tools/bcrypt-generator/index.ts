import type { ToolDefinition } from '../types';

const bcryptGenerator: ToolDefinition = {
  id: 'bcrypt-generator',
  name: 'Bcrypt Generator',
  tagline: 'Hash and verify bcrypt passwords',
  description:
    'Generate bcrypt hashes with a chosen cost and check a password against an existing hash, entirely in your browser.',
  category: 'Security',
  icon: 'lock',
  tags: ['bcrypt', 'Hash', 'Password'],
  status: 'available',
  load: () => import('./BcryptGeneratorPage'),
  docs: () => import('./docs'),
};

export default bcryptGenerator;
