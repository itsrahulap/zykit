import type { ToolDefinition } from '../types';

const xmlFormatter: ToolDefinition = {
  id: 'xml-formatter',
  name: 'XML Formatter & XPath',
  tagline: 'Format XML and test XPath queries',
  description:
    'Pretty-print or minify XML, validate it with exact errors, and run XPath expressions to see the matching nodes.',
  category: 'Data',
  icon: 'code',
  tags: ['XML', 'XPath', 'Format'],
  status: 'available',
  load: () => import('./XmlFormatterPage'),
  docs: () => import('./docs'),
};

export default xmlFormatter;
