import type { ToolDefinition } from '../types';

const tomlJson: ToolDefinition = {
  id: 'toml-json',
  name: 'TOML ↔ JSON',
  tagline: 'Convert between TOML and JSON',
  description:
    'Convert TOML config files to JSON and JSON back to TOML, with precise error locations and dates handled correctly.',
  category: 'Data',
  icon: 'swap',
  tags: ['TOML', 'JSON', 'Config'],
  status: 'available',
  load: () => import('./TomlJsonPage'),
  docs: () => import('./docs'),
};

export default tomlJson;
