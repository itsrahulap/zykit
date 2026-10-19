import type { ToolDefinition } from '../types';

const gitCommandBuilder: ToolDefinition = {
  id: 'git-command-builder',
  name: 'Git Command Builder',
  tagline: 'Build safe git commands with plain-English explanations',
  description:
    'Pick a task, fill in a form and get the git command, what each part does, and a risk level, with safer alternatives for destructive commands.',
  category: 'DevOps & Config',
  icon: 'code',
  tags: ['git', 'command', 'cli', 'branch', 'rebase', 'reset', 'undo'],
  status: 'available',
  load: () => import('./GitCommandBuilderPage'),
  docs: () => import('./docs'),
};

export default gitCommandBuilder;
