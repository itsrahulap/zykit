import type { ToolDefinition } from '../types';

const dockerfileGenerator: ToolDefinition = {
  id: 'dockerfile-generator',
  name: 'Dockerfile Generator',
  tagline: 'Production-ready Dockerfiles with explanations',
  description:
    'Pick a stack (Node, React, Angular, Python, FastAPI, Django, Java, Go, static), answer a few questions and get a multi-stage Dockerfile and .dockerignore with every line explained.',
  category: 'DevOps & Config',
  icon: 'layers',
  tags: ['docker', 'dockerfile', 'container', 'node', 'python', 'go', 'java', 'dockerignore'],
  status: 'available',
  load: () => import('./DockerfileGeneratorPage'),
  docs: () => import('./docs'),
};

export default dockerfileGenerator;
