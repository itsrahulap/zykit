import type { IconName } from '../../shared/ui/ui';
import type { SubjectId } from '../types/content';

export const SUBJECT_ICONS: Record<SubjectId, IconName> = {
  javascript: 'code',
  typescript: 'braces',
  dsa: 'network',
  'web-fundamentals': 'globe',
  backend: 'server',
  databases: 'database',
  'system-design': 'building',
  'software-architecture': 'layers',
};
