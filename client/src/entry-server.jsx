/**
 * Build-time renderer (not shipped to the browser). scripts/prerender.mjs uses it to
 * turn pre-renderable routes into static HTML so search engines and social link
 * previews see the full page content without running JavaScript.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { listRoutes, routes } from './routes/routes';

export { SITE, homeStructuredData } from './content/site';
export { listRoutes };

export function render(url) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  return renderToString(
    <StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </StrictMode>,
  );
}
