import { Link, useRouteError } from 'react-router';

/** Rendered by the router when a route throws while loading or rendering. */
export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="placeholder container">
      <p className="eyebrow">Error</p>
      <h1>Something went wrong</h1>
      <p className="placeholder__text">{error?.statusText || error?.message || 'An unexpected error occurred.'}</p>
      <Link to="/" className="button">
        Back to home
      </Link>
    </div>
  );
}
