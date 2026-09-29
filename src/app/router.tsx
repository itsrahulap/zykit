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
        path: 'claude-code',
        handle: { pageMeta: true } satisfies RouteHandle,
        lazy: async () => ({ Component: (await import('../pages/claude-code/ClaudeCodePage')).default }),
      },
      { path: '*', element: <NotFoundPage />, handle: { title: 'Not found' } satisfies RouteHandle },
    ],
  },
]);
