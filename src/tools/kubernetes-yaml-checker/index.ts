import type { ToolDefinition } from '../types';

const kubernetesYamlChecker: ToolDefinition = {
  id: 'kubernetes-yaml-checker',
  name: 'Kubernetes YAML Checker',
  tagline: 'Validate and explain Kubernetes manifests',
  description:
    'Paste Kubernetes YAML to check structure and best practices: resource limits, image tags, probes, security context and more.',
  category: 'DevOps & Config',
  icon: 'server',
  tags: ['Kubernetes', 'YAML', 'k8s'],
  status: 'available',
  accepts: ['yaml'],
  shareable: true,
  load: () => import('./KubernetesYamlCheckerPage'),
  docs: () => import('./docs'),
};

export default kubernetesYamlChecker;
