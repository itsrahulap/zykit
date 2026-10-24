// Starter diagrams for the "Load a sample…" menu.

import type { Diagram } from './model';

export const SAMPLES: { id: string; name: string; diagram: Diagram }[] = [
  {
    id: 'web-app',
    name: 'Web app',
    diagram: {
      groups: [{ id: 'group-1', label: 'Backend (VPC)', x: 230, y: 20, width: 600, height: 260 }],
      nodes: [
        { id: 'node-1', kind: 'frontend', label: 'Browser SPA', x: 40, y: 110 },
        { id: 'node-2', kind: 'service', label: 'API server', x: 260, y: 110 },
        { id: 'node-3', kind: 'cache', label: 'Redis cache', x: 460, y: 50 },
        { id: 'node-4', kind: 'database', label: 'PostgreSQL', x: 460, y: 180 },
        { id: 'node-5', kind: 'external', label: 'Payment provider', x: 900, y: 110 },
        { id: 'node-6', kind: 'service', label: 'Auth service', x: 660, y: 110 },
      ],
      edges: [
        { id: 'edge-1', from: 'node-1', to: 'node-2', label: 'HTTPS' },
        { id: 'edge-2', from: 'node-2', to: 'node-3', label: 'read-through' },
        { id: 'edge-3', from: 'node-2', to: 'node-4', label: 'SQL' },
        { id: 'edge-4', from: 'node-2', to: 'node-6', label: 'verify token' },
        { id: 'edge-5', from: 'node-2', to: 'node-5', label: 'charge' },
      ],
    },
  },
  {
    id: 'queue',
    name: 'Queue-based system',
    diagram: {
      groups: [{ id: 'group-1', label: 'Workers', x: 450, y: 20, width: 220, height: 250 }],
      nodes: [
        { id: 'node-1', kind: 'service', label: 'Order API', x: 40, y: 110 },
        { id: 'node-2', kind: 'queue', label: 'orders queue', x: 250, y: 110 },
        { id: 'node-3', kind: 'service', label: 'Fulfilment worker', x: 485, y: 60 },
        { id: 'node-4', kind: 'service', label: 'Email worker', x: 485, y: 170 },
        { id: 'node-5', kind: 'database', label: 'Orders DB', x: 740, y: 60 },
        { id: 'node-6', kind: 'external', label: 'Email API', x: 740, y: 170 },
      ],
      edges: [
        { id: 'edge-1', from: 'node-1', to: 'node-2', label: 'publish' },
        { id: 'edge-2', from: 'node-2', to: 'node-3', label: 'consume' },
        { id: 'edge-3', from: 'node-2', to: 'node-4', label: 'consume' },
        { id: 'edge-4', from: 'node-3', to: 'node-5', label: 'update status' },
        { id: 'edge-5', from: 'node-4', to: 'node-6', label: 'send' },
      ],
    },
  },
  {
    id: 'three-tier',
    name: 'Frontend / API / database',
    diagram: {
      groups: [],
      nodes: [
        { id: 'node-1', kind: 'frontend', label: 'Web frontend', x: 40, y: 60 },
        { id: 'node-2', kind: 'service', label: 'REST API', x: 280, y: 60 },
        { id: 'node-3', kind: 'database', label: 'Database', x: 520, y: 60 },
      ],
      edges: [
        { id: 'edge-1', from: 'node-1', to: 'node-2', label: 'JSON over HTTPS' },
        { id: 'edge-2', from: 'node-2', to: 'node-3', label: 'queries' },
      ],
    },
  },
];
