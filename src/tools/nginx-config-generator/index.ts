import type { ToolDefinition } from '../types';

const nginxConfigGenerator: ToolDefinition = {
  id: 'nginx-config-generator',
  name: 'nginx Config Generator',
  tagline: 'Build nginx server blocks',
  description:
    'Generate nginx configs for static sites, SPAs, reverse proxies and redirects, with HTTPS, gzip, caching and security headers.',
  category: 'DevOps & Config',
  icon: 'server',
  tags: ['nginx', 'Config', 'Reverse proxy'],
  status: 'available',
  shareable: true,
  load: () => import('./NginxConfigGeneratorPage'),
  docs: () => import('./docs'),
};

export default nginxConfigGenerator;
