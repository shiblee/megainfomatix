import { Link, NavLink } from 'react-router';
import { env } from '../config/env';
import { navigation } from '../config/navigation';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const items = navigation.filter((item) => !item.protected || isAuthenticated);

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand">
          {env.appName}
        </Link>

        <nav className="navbar__links" aria-label="Main navigation">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="navbar__link">
              {item.label}
            </NavLink>
          ))}
        </nav>

        {isAuthenticated && (
          <div className="navbar__user">
            <span className="navbar__user-name">{user.name}</span>
            <button type="button" className="button button--ghost" onClick={logout}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
