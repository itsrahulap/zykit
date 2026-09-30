import type { ToolDefinition } from '../types';

const stringEscaper: ToolDefinition = {
  id: 'string-escaper',
  name: 'String Escaper',
  tagline: 'Escape and unescape strings for any language',
  description:
    'Escape or unescape text for JSON, JavaScript, SQL, regex, shell, C, CSV, XML and URL contexts.',
  category: 'Developer',
  icon: 'code',
  tags: ['Escape', 'JSON', 'SQL', 'Shell'],
  status: 'available',
  load: () => import('./StringEscaperPage'),
};

export default stringEscaper;
