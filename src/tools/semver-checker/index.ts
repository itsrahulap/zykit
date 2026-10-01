import type { ToolDefinition } from '../types';

const semverChecker: ToolDefinition = {
  id: 'semver-checker',
  name: 'Semver Checker',
  tagline: 'Check versions against semver ranges',
  description:
    'Test whether versions satisfy npm-style ranges like ^1.2.0 or ~2.x, compare and sort versions, and see ranges explained.',
  category: 'Code',
  icon: 'layers',
  tags: ['Semver', 'npm', 'Version'],
  status: 'available',
  accepts: ['text'],
  shareable: true,
  load: () => import('./SemverCheckerPage'),
  docs: () => import('./docs'),
};

export default semverChecker;
