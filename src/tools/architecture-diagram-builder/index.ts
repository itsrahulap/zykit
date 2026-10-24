import type { ToolDefinition } from '../types';

const architectureDiagramBuilder: ToolDefinition = {
  id: 'architecture-diagram-builder',
  name: 'Architecture Diagram Builder',
  tagline: 'Draw system architecture diagrams and export Mermaid',
  description:
    'Drag services, databases, queues and external APIs onto a canvas, connect them, group them, and export SVG, PNG or a Mermaid flowchart.',
  category: 'Productivity',
  icon: 'layers',
  tags: ['architecture', 'diagram', 'mermaid', 'system design', 'flowchart', 'svg'],
  status: 'available',
  load: () => import('./ArchitectureDiagramBuilderPage'),
  docs: () => import('./docs'),
};

export default architectureDiagramBuilder;
