import type { ToolDefinition } from '../types';

const bcryptGenerator: ToolDefinition = {
  id: 'bcrypt-generator',
  name: 'Bcrypt Generator',
  tagline: 'Hash and verify bcrypt passwords',
  description:
    'Generate bcrypt hashes with a chosen cost and check a password against an existing hash. It runs in a Web Worker in your browser and nothing is uploaded or saved.',
  category: 'Security',
  icon: 'lock',
  tags: ['bcrypt', 'Hash', 'Password', 'Verify'],
  status: 'available',
  shareable: false,
  load: () => import('./BcryptGeneratorPage'),
  docs: () => import('./docs'),
};

export default bcryptGenerator;
