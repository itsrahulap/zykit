import type { ToolDefinition } from '../types';

const webhookPayloadBuilder: ToolDefinition = {
  id: 'webhook-payload-builder',
  name: 'Webhook Payload Builder',
  tagline: 'Build and sign test webhook payloads',
  description:
    'Create webhook test requests with realistic sample events, HMAC signatures (GitHub, Stripe or generic style), a cURL command and a fixture file.',
  category: 'Network & HTTP',
  icon: 'network',
  tags: ['webhook', 'payload', 'hmac', 'signature', 'stripe', 'github', 'curl', 'fixture'],
  status: 'available',
  load: () => import('./WebhookPayloadBuilderPage'),
  docs: () => import('./docs'),
};

export default webhookPayloadBuilder;
