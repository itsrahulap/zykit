import type { ToolDefinition } from '../types';

const stringEscaper: ToolDefinition = {
  id: 'string-escaper',
  name: 'String Escaper',
  tagline: 'Escape and unescape strings for any language',
  description:
    'Escape or unescape text for JSON, JavaScript, SQL, regex, shell, C, CSV, XML and URL contexts.',
  category: 'Code',
  icon: 'code',
  tags: ['Escape', 'JSON', 'SQL', 'Shell'],
  status: 'available',
  accepts: ['text', 'code'],
  produces: ['text'],
  shareable: true,
  load: () => import('./StringEscaperPage'),
  docs: () => import('./docs'),
};

export default stringEscaper;
