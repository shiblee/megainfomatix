/**
 * TEMPORARY home page.
 * The final Index page (design, content, API needs) will be provided in Phase 2.
 * Replace this component, or point the index route in src/routes/index.jsx at the new page.
 */
import SystemStatus from '../components/SystemStatus';

export default function Home() {
  return (
    <div className="placeholder">
      <p className="eyebrow">Index page</p>
      <h1>Coming soon</h1>
      <p className="placeholder__text">
        The application foundation is running. The final index page will be added in the next phase.
      </p>
      <SystemStatus />
    </div>
  );
}
