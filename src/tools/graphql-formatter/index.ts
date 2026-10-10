import type { ToolDefinition } from '../types';

const graphqlFormatter: ToolDefinition = {
  id: 'graphql-formatter',
  name: 'GraphQL Formatter',
  tagline: 'Format and minify GraphQL',
  description:
    'Pretty-print or minify GraphQL queries and schemas, with syntax errors shown at the exact line and column.',
  category: 'Code',
  icon: 'braces',
  tags: ['GraphQL', 'Format', 'Minify'],
  accepts: ['code'],
  produces: ['code'],
  shareable: true,
  status: 'available',
  load: () => import('./GraphqlFormatterPage'),
  docs: () => import('./docs'),
};

export default graphqlFormatter;
