import { createBrowserRouter } from 'react-router';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { learnRoutes } from '../learn/routes';
import { TOOLS, toolPath } from '../tools/registry';
import { Layout, type RouteHandle } from './Layout';
import { PageLoading, RouteError } from './RouteStates';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoading />,
    children: [
      { index: true, element: <HomePage /> },
      ...TOOLS.filter((t) => t.status !== 'coming-soon').map((tool) => ({
        path: toolPath(tool),
        handle: { tool } satisfies RouteHandle,
        lazy: async () => ({ Component: (await tool.load()).default }),
      })),
      ...learnRoutes,
      {
        path: 'blog',
        handle: { pageMeta: true } satisfies RouteHandle,
        children: [
          { index: true, lazy: async () => ({ Component: (await import('../blog/pages/BlogHomePage')).default }) },
          { path: ':slug', lazy: async () => ({ Component: (await import('../blog/pages/BlogPostPage')).default }) },
        ],
      },
      { path: '*', element: <NotFoundPage />, handle: { title: 'Not found' } satisfies RouteHandle },
    ],
  },
]);
