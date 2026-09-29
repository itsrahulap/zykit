import type { ToolDefinition } from '../types';

const caseConverter: ToolDefinition = {
  id: 'case-converter',
  name: 'Case Converter',
  tagline: 'camelCase, snake_case, Title Case and more',
  description:
    'Convert text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, sentence case and more.',
  category: 'Text',
  icon: 'text',
  tags: ['camelCase', 'snake_case', 'kebab-case'],
  status: 'available',
  load: () => import('./CaseConverterPage'),
};

export default caseConverter;
