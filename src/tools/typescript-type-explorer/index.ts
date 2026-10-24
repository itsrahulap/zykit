import type { ToolDefinition } from '../types';

const typescriptTypeExplorer: ToolDefinition = {
  id: 'typescript-type-explorer',
  name: 'TypeScript Type Explorer',
  tagline: 'Explore TypeScript types with the real compiler',
  description:
    'Guided, editable examples of keyof, typeof, generics, conditional, mapped and template literal types and the built-in utility types, checked by the TypeScript compiler in your browser.',
  category: 'Code',
  icon: 'braces',
  tags: ['typescript', 'types', 'generics', 'utility types', 'conditional types', 'mapped types', 'keyof'],
  status: 'available',
  shareable: true,
  load: () => import('./TypescriptTypeExplorerPage'),
  docs: () => import('./docs'),
};

export default typescriptTypeExplorer;
