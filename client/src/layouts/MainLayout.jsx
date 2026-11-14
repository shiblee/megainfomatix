import { Outlet } from 'react-router';
import Navbar from '../components/Navbar';
import { env } from '../config/env';

/** Shared shell for all standard pages. Pages render into <Outlet />. */
export default function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main container">
        <Outlet />
      </main>
      <footer className="app-footer container">
        © {new Date().getFullYear()} {env.appName}
      </footer>
    </div>
  );
}
