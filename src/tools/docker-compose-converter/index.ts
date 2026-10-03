import type { ToolDefinition } from '../types';

const dockerComposeConverter: ToolDefinition = {
  id: 'docker-compose-converter',
  name: 'docker run ↔ Compose',
  tagline: 'Convert docker run commands to docker-compose and back',
  description:
    'Turn docker run commands into a docker-compose.yml service (ports, volumes, env, health checks, resources), or a Compose service back into docker run commands, with warnings for anything that does not map.',
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
