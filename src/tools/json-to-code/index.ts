import type { ToolDefinition } from '../types';

const jsonToCode: ToolDefinition = {
  id: 'json-to-code',
  name: 'JSON to Code',
  tagline: 'Generate Go, Python, Rust, Java, C# and Kotlin models from JSON',
  description:
    'Turn JSON into typed models: Go structs, Python dataclasses or Pydantic, Rust serde structs, Java records or POJOs, C# classes and Kotlin data classes.',
  category: 'Data',
  icon: 'braces',
  tags: ['JSON', 'Go', 'Python', 'Rust', 'Java', 'C#', 'Kotlin', 'Structs'],
  status: 'available',
  accepts: ['json'],
  produces: ['code'],
  shareable: true,
  load: () => import('./JsonToCodePage'),
  docs: () => import('./docs'),
};

export default jsonToCode;
