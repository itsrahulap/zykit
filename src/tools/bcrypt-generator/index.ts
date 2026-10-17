import type { ToolDefinition } from '../types';

const bcryptGenerator: ToolDefinition = {
  id: 'bcrypt-generator',
  name: 'Bcrypt Generator',
  tagline: 'Hash and verify bcrypt passwords',
  description:
    'Generate bcrypt hashes with a chosen cost and verify passwords against a hash. Runs in your browser; nothing is uploaded or saved.',
  category: 'Security',
  icon: 'lock',
  tags: ['bcrypt', 'Hash', 'Password', 'Verify'],
  status: 'available',
  shareable: false,
  load: () => import('./BcryptGeneratorPage'),
  docs: () => import('./docs'),
};

export default bcryptGenerator;
