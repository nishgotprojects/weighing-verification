import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { getAllApplications } from '@/services/applicationService';
import { Application } from '@/types';
import { getStatusBadgeClass, formatDateTime } from '@/lib/utils';
import { Search, ArrowRight } from 'lucide-react';

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getAllApplications().then(a => { setApps(a); setLoading(false); });
  }, []);

  const filtered = apps.filter(a => {
    const s = search.toLowerCase();
    const match = !search || a.instrumentName.toLowerCase().includes(s) || a.ownerEmail.toLowerCase().includes(s) || a.serialNumber.toLowerCase().includes(s);
    return match && (filter === 'all' || a.status === filter || (filter === 'flagged' && a.aiFlagged));
  });

  return (
    <Shell title="All Applications">
      <div className="page-header">
        <h1 className="page-title">All Applications</h1>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['all', 'pending', 'approved', 'rejected', 'flagged'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
          <table className="data-table">
            <thead><tr><th>Instrument</th><th>Owner</th><th>Serial</th><th>Status</th><th>AI Check</th><th>Submitted</th><th></th></tr></thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td><div style={{ fontWeight: 500 }}>{app.instrumentName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.instrumentType}</div></td>
                  <td style={{ fontSize: '0.8125rem' }}>{app.ownerEmail}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{app.serialNumber}</td>
                  <td><span className={getStatusBadgeClass(app.status)}>{app.status}</span></td>
                  <td>{app.aiFlagged ? <span className="badge badge-flagged">⚠ Flagged</span> : <span className="badge badge-approved">✓ Clear</span>}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatDateTime(app.submittedAt)}</td>
                  <td><Link to={`/inspector/applications/${app.id}`} className="btn btn-ghost btn-sm">View <ArrowRight size={14} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
