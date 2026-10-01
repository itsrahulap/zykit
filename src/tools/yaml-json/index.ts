import type { ToolDefinition } from '../types';

const yamlJson: ToolDefinition = {
  id: 'yaml-json',
  name: 'YAML ↔ JSON',
  tagline: 'Convert between YAML and JSON',
  description:
    'Convert YAML to JSON and JSON to YAML, with multi-document YAML, anchors and aliases resolved, and precise error locations.',
  category: 'Data',
  icon: 'swap',
  tags: ['YAML', 'JSON', 'Convert'],
  status: 'available',
  accepts: ['yaml', 'json'],
  produces: ['json', 'yaml'],
  shareable: true,
  load: () => import('./YamlJsonPage'),
  docs: () => import('./docs'),
};

export default yamlJson;
