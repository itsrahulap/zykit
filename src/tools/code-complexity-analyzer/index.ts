import type { ToolDefinition } from '../types';

const codeComplexityAnalyzer: ToolDefinition = {
  id: 'code-complexity-analyzer',
  name: 'Code Complexity Analyzer',
  tagline: 'Find the most complex functions in JavaScript and TypeScript',
  description:
    'Paste JavaScript or TypeScript to see each function\'s cyclomatic complexity, nesting depth and length, with the responsible lines highlighted and configurable thresholds.',
  category: 'Code',
  icon: 'code',
  tags: ['complexity', 'cyclomatic', 'javascript', 'typescript', 'code quality', 'refactoring', 'nesting'],
  status: 'available',
  load: () => import('./CodeComplexityAnalyzerPage'),
  docs: () => import('./docs'),
};

export default codeComplexityAnalyzer;
