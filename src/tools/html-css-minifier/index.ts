import type { ToolDefinition } from '../types';

const htmlCssMinifier: ToolDefinition = {
  id: 'html-css-minifier',
  name: 'HTML & CSS Minifier',
  tagline: 'Minify or beautify HTML and CSS safely',
  description:
    'Minify HTML and CSS by removing comments and whitespace, leaving strings, pre blocks and scripts alone, or beautify them. Shows sizes before and after, with gzip.',
  category: 'Code',
  icon: 'code',
  tags: ['HTML', 'CSS', 'Minify', 'Beautify', 'Gzip'],
  status: 'available',
  shareable: true,
  load: () => import('./HtmlCssMinifierPage'),
  docs: () => import('./docs'),
};

export default htmlCssMinifier;
