import SystemStatus from '../components/SystemStatus';

/** Technical status page (API, database, Python). Not linked from the navigation. */
export default function Status() {
  return (
    <div className="placeholder">
      <p className="eyebrow">System</p>
      <h1>Status</h1>
      <SystemStatus />
    </div>
  );
}
