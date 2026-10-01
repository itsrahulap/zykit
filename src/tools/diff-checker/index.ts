import type { ToolDefinition } from '../types';

const diffChecker: ToolDefinition = {
  id: 'diff-checker',
  name: 'Diff Checker',
  tagline: 'Compare two texts line by line',
  description:
    'See what changed between two versions of text or code, with word-level highlights, side-by-side or unified.',
  category: 'Code',
  icon: 'diff',
  tags: ['Diff', 'Compare', 'Text', 'Code'],
  status: 'available',
  accepts: ['text', 'code'],
  shareable: true,
  load: () => import('./DiffCheckerPage'),
  docs: () => import('./docs'),
};

export default diffChecker;
