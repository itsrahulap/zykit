import type { ToolDefinition } from '../types';

const markdownEditor: ToolDefinition = {
  id: 'markdown-editor',
  name: 'Markdown Editor',
  tagline: 'Write Markdown with a live preview',
  description:
    'Edit Markdown side by side with a safe live preview, GitHub-flavoured tables and task lists, and export to HTML.',
  category: 'Text',
  icon: 'file',
  tags: ['Markdown', 'GFM', 'Preview', 'HTML'],
  status: 'available',
  accepts: ['markdown'],
  produces: ['markdown'],
  shareable: true,
  load: () => import('./MarkdownEditorPage'),
  docs: () => import('./docs'),
};

export default markdownEditor;
