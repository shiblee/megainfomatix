/**
 * Application route definitions, shared by the browser router (routes/index.jsx)
 * and the build-time pre-renderer (entry-server.jsx).
 *
 * Adding a page:
 *   1. create src/pages/MyPage.jsx
 *   2. add { path: 'my-page', element: <MyPage /> } to the children below
 *      (inside the ProtectedRoute block if it requires sign-in)
 *   3. optionally add a link in src/config/navigation.js
 *
 * SEO: routes with `handle: { prerender: true }` are rendered to static HTML at build
 * time, listed in sitemap.xml and indexable. All other routes are served with
 * `X-Robots-Tag: noindex`. Unknown paths get a real 404 status.
 */
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import ErrorPage from '../pages/ErrorPage';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import Status from '../pages/Status';

export const routes = [
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home />, handle: { prerender: true, priority: '1.0', changefreq: 'weekly' } },
      { path: 'status', element: <Status /> },

      {
        element: <ProtectedRoute />,
        children: [
          // Future authenticated pages, e.g.:
          // { path: 'dashboard', element: <Dashboard /> },
        ],
      },

      { path: '*', element: <NotFound /> },
    ],
  },
];

/** Flatten routes into [{ path, prerender, priority, changefreq }] for the pre-renderer. */
export function listRoutes(list = routes, parent = '') {
  return list.flatMap((route) => {
    const path = route.index ? parent || '/' : route.path ? `${parent.replace(/\/$/, '')}/${route.path}`.replace(/^\/\//, '/') : parent;
    // layout routes (with children) are wrappers, not pages; skip wildcard/dynamic paths
    const isPage = route.index || (route.path && !route.children);
    const own = isPage && !path.includes('*') && !path.includes(':') ? [{ path, ...route.handle }] : [];
    return [...own, ...(route.children ? listRoutes(route.children, path) : [])];
  });
}
