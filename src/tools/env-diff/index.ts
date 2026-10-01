import type { ToolDefinition } from '../types';

const envDiff: ToolDefinition = {
  id: 'env-diff',
  name: '.env Diff',
  tagline: 'Compare and validate .env files',
  description:
    'Compare two .env files to find missing, extra and changed keys, catch duplicates and syntax problems, with values masked.',
  category: 'Developer',
  icon: 'diff',
  tags: ['dotenv', '.env', 'Config'],
  status: 'available',
  shareable: false,
  load: () => import('./EnvDiffPage'),
  docs: () => import('./docs'),
};

export default envDiff;
