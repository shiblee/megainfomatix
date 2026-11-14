import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="placeholder">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="placeholder__text">The page you are looking for does not exist.</p>
      <Link to="/" className="button">
        Back to home
      </Link>
    </div>
  );
}
