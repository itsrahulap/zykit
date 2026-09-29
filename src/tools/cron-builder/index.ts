import type { ToolDefinition } from '../types';

const cronBuilder: ToolDefinition = {
  id: 'cron-builder',
  name: 'Cron Expression Builder',
  tagline: 'Build and explain cron schedules',
  description:
    'Build cron expressions visually, get them explained in plain English and see the next run times.',
  category: 'Developer',
  icon: 'clock',
  tags: ['Cron', 'Crontab', 'Schedule'],
  status: 'available',
  shareable: true,
  load: () => import('./CronBuilderPage'),
};

export default cronBuilder;
