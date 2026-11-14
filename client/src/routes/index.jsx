/**
 * Application route registry.
 *
 * Adding a page:
 *   1. create src/pages/MyPage.jsx
 *   2. add { path: 'my-page', element: <MyPage /> } to the children below
 *      (inside the ProtectedRoute block if it requires sign-in)
 *   3. optionally add a link in src/config/navigation.js
 *
 * Pages that need a different shell (e.g. a full-screen landing/index page)
 * can be added as a separate top-level route with their own layout.
 */
import { createBrowserRouter } from 'react-router';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import ErrorPage from '../pages/ErrorPage';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import Status from '../pages/Status';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
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
]);
