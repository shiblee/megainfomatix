/**
 * Shows connectivity of API / database / Python service via GET /api/health.
 * Useful during development; safe to remove from pages later.
 */
import useAsync from '../hooks/useAsync';
import { systemService } from '../services/systemService';
import { cx } from '../utils/helpers';

const LABELS = { ok: 'Connected', not_configured: 'Not configured', unreachable: 'Unreachable', checking: 'Checking…' };

function StatusRow({ name, status }) {
  return (
    <li className="status__row">
      <span>{name}</span>
      <span className={cx('badge', `badge--${status}`)}>{LABELS[status] || status}</span>
    </li>
  );
}

export default function SystemStatus() {
  const { data, error, isLoading, reload } = useAsync((signal) => systemService.getHealth({ signal }), []);

  const api = isLoading ? 'checking' : error ? 'unreachable' : 'ok';
  const database = isLoading ? 'checking' : data?.database || 'unreachable';
  const python = isLoading ? 'checking' : data?.python || 'unreachable';

  return (
    <section className="card status" aria-labelledby="system-status-title">
      <div className="status__header">
        <h2 id="system-status-title">System status</h2>
        <button type="button" className="button button--ghost" onClick={reload} disabled={isLoading}>
          Refresh
        </button>
      </div>
      <ul className="status__list">
        <StatusRow name="API server" status={api} />
        <StatusRow name="Database" status={database} />
        <StatusRow name="Python analytics" status={python} />
      </ul>
    </section>
  );
}
