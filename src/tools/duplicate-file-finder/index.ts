import type { ToolDefinition } from '../types';

const duplicateFileFinder: ToolDefinition = {
  id: 'duplicate-file-finder',
  name: 'Duplicate File Finder',
  tagline: 'Find duplicate files by content',
  description:
    'Select files or a folder to find exact duplicates by SHA-256 hash, see wasted space and export a report. Files never leave your device.',
  category: 'Documents',
  icon: 'diff',
  tags: ['Duplicates', 'SHA-256', 'Files'],
  status: 'available',
  load: () => import('./DuplicateFileFinderPage'),
  docs: () => import('./docs'),
};

export default duplicateFileFinder;
