import type { ToolDefinition } from '../types';

const htmlCssMinifier: ToolDefinition = {
  id: 'html-css-minifier',
  name: 'HTML & CSS Minifier',
  tagline: 'Minify or beautify HTML and CSS',
  description:
    'Shrink HTML and CSS by removing comments and whitespace safely, or pretty-print them, and see the size saved.',
  category: 'Code',
  icon: 'code',
  tags: ['HTML', 'CSS', 'Minify', 'Beautify'],
  status: 'available',
  load: () => import('./HtmlCssMinifierPage'),
  docs: () => import('./docs'),
};

export default htmlCssMinifier;
