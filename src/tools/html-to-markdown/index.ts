import type { ToolDefinition } from '../types';

const htmlToMarkdown: ToolDefinition = {
  id: 'html-to-markdown',
  name: 'HTML to Markdown',
  tagline: 'Turn HTML into clean Markdown',
  description:
    'Paste HTML or rich text and get tidy Markdown with headings, lists, links, tables and code blocks preserved.',
  category: 'Text',
  icon: 'file',
  tags: ['HTML', 'Markdown', 'Convert'],
  accepts: ['code'],
  produces: ['markdown'],
  shareable: true,
  status: 'available',
  load: () => import('./HtmlToMarkdownPage'),
  docs: () => import('./docs'),
};

export default htmlToMarkdown;
