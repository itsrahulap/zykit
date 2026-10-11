import type { ToolDefinition } from '../types';

const xmlFormatter: ToolDefinition = {
  id: 'xml-formatter',
  name: 'XML Formatter',
  tagline: 'Format, minify, validate and query XML',
  description: 'Pretty-print or minify XML, find syntax errors by line and column, and test XPath expressions in your browser.',
  category: 'Data',
  icon: 'code',
  tags: ['XML', 'Format', 'Minify', 'Validate', 'XPath'],
  status: 'available',
  accepts: ['xml'],
  produces: ['xml'],
  shareable: true,
  load: () => import('./XmlFormatterPage'),
  docs: () => import('./docs'),
};

export default xmlFormatter;
