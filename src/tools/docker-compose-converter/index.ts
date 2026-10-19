import type { ToolDefinition } from '../types';

const dockerComposeConverter: ToolDefinition = {
  id: 'docker-compose-converter',
  name: 'docker run ↔ Compose',
  tagline: 'Convert docker run commands to docker-compose and back',
  description:
    'Convert docker run commands to a docker-compose.yml and Compose services back to docker run, with warnings for anything that doesn’t map.',
  category: 'DevOps & Config',
  icon: 'server',
  tags: ['Docker', 'Compose', 'YAML', 'docker run'],
  status: 'available',
  accepts: ['yaml'],
  produces: ['yaml', 'code'],
  shareable: true,
  load: () => import('./DockerComposeConverterPage'),
  docs: () => import('./docs'),
};

export default dockerComposeConverter;
