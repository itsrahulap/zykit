// Routes for the Learn section. Every page is lazy-loaded, so none of the lessons'
// code or content downloads until someone opens /learn.

import type { RouteObject } from 'react-router';
import type { RouteHandle } from '../app/Layout';

// Pages set their own title from content (useDocumentMeta), so the layout leaves it alone.
const handle = { pageMeta: true } satisfies RouteHandle;
const page = (load: () => Promise<{ default: React.ComponentType }>): Pick<RouteObject, 'lazy' | 'handle'> => ({
  handle,
  lazy: async () => ({ Component: (await load()).default }),
});

export const learnRoutes: RouteObject[] = [
  {
    path: 'learn',
    lazy: async () => ({ Component: (await import('./LearnLayout')).default }),
    handle,
    children: [
      { index: true, ...page(() => import('./pages/LearnHomePage')) },
      { path: 'progress', ...page(() => import('./pages/ProgressPage')) },
      { path: 'bookmarks', ...page(() => import('./pages/BookmarksPage')) },
      { path: 'problems', ...page(() => import('./pages/ProblemsHomePage')) },
      { path: 'problems/:categoryId', ...page(() => import('./pages/ProblemCategoryPage')) },
      { path: 'problems/:categoryId/:problemId', ...page(() => import('./pages/ProblemPage')) },
      { path: 'case-studies', ...page(() => import('./pages/CaseStudiesPage')) },
      { path: 'case-studies/:caseStudyId', ...page(() => import('./pages/CaseStudyPage')) },
      { path: ':subjectId', ...page(() => import('./pages/SubjectPage')) },
      { path: ':subjectId/:topicId', ...page(() => import('./pages/TopicPage')) },
    ],
  },
];
