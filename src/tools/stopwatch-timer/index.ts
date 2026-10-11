import type { ToolDefinition } from '../types';

const stopwatchTimer: ToolDefinition = {
  id: 'stopwatch-timer',
  name: 'Stopwatch & Timer',
  tagline: 'Stopwatch, countdown and Pomodoro',
  description:
    'A precise stopwatch with laps, a countdown timer with alerts and a Pomodoro focus timer, all in your browser.',
  category: 'Productivity',
  icon: 'clock',
  tags: ['Stopwatch', 'Timer', 'Pomodoro'],
  status: 'available',
  shareable: true,
  load: () => import('./StopwatchTimerPage'),
  docs: () => import('./docs'),
};

export default stopwatchTimer;
