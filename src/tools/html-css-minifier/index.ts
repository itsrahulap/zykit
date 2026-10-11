import type { ToolDefinition } from '../types';

const htmlCssMinifier: ToolDefinition = {
  id: 'html-css-minifier',
  name: 'HTML & CSS Minifier',
  tagline: 'Minify or beautify HTML and CSS safely',
  description:
    'Shrink HTML and CSS by removing comments and whitespace without touching strings, pre blocks or scripts, or beautify them again, with before and after sizes including gzip.',
  category: 'Code',
  icon: 'code',
  tags: ['HTML', 'CSS', 'Minify', 'Beautify', 'Gzip'],
  status: 'available',
  shareable: true,
  load: () => import('./HtmlCssMinifierPage'),
  docs: () => import('./docs'),
};

export default htmlCssMinifier;
