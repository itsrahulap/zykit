import type { ToolDefinition } from '../types';

const gitPlayground: ToolDefinition = {
  id: 'git-playground',
  name: 'Git Playground',
  tagline: 'Practice git commands safely and watch the commit graph change',
  description:
    'A pretend git repository in your browser: run real git commands, edit files, and see commits, branches and HEAD move on a live graph. Includes guided challenges.',
  category: 'DevOps & Config',
  icon: 'diff',
  tags: ['git', 'playground', 'practice', 'branch', 'merge', 'rebase', 'commit graph', 'learn'],
  status: 'available',
  load: () => import('./GitPlaygroundPage'),
  docs: () => import('./docs'),
};

export default gitPlayground;
