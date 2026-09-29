import type { ToolDefinition } from '../types';

const xmlJson: ToolDefinition = {
  id: 'xml-json',
  name: 'XML ↔ JSON',
  tagline: 'Convert between XML and JSON',
  description:
    'Convert XML to JSON and back, with attributes, text nodes, repeated elements and namespaces handled predictably.',
  category: 'Data',
  icon: 'swap',
  tags: ['XML', 'JSON', 'Convert'],
  status: 'available',
  accepts: ['xml', 'json'],
  produces: ['json', 'xml'],
  shareable: true,
  load: () => import('./XmlJsonPage'),
};

export default xmlJson;
