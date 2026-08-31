import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { getAllApplications } from '@/services/applicationService';
import { Application } from '@/types';
import { getStatusBadgeClass, formatRelative } from '@/lib/utils';
import { Search, ArrowRight, Filter } from 'lucide-react';

export default function InspectorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    getAllApplications().then(apps => { setApplications(apps); setLoading(false); });
  }, []);

  const filtered = applications.filter(a => {
    const matchSearch = !search || a.instrumentName.toLowerCase().includes(search.toLowerCase()) || a.ownerEmail.toLowerCase().includes(search.toLowerCase()) || a.serialNumber.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchSearch;
    if (filter === 'flagged') return matchSearch && a.aiFlagged;
    return matchSearch && a.status === filter;
  });

  return (
    <Shell title="Applications Queue">
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications Queue</h1>
          <p className="page-subtitle">{filtered.length} applications</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search instrument, owner, serial..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['pending', 'approved', 'rejected', 'flagged', 'all'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Instrument</th><th>Owner</th><th>Serial</th><th>Status</th><th>AI Check</th><th>Submitted</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td><div style={{ fontWeight: 500 }}>{app.instrumentName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.instrumentType}</div></td>
                  <td style={{ fontSize: '0.8125rem' }}>{app.ownerEmail}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{app.serialNumber}</td>
                  <td><span className={getStatusBadgeClass(app.status)}>{app.status}</span></td>
                  <td>{app.aiFlagged ? <span className="badge badge-flagged">⚠ Flagged</span> : <span className="badge badge-approved">✓ Clear</span>}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatRelative(app.submittedAt)}</td>
                  <td><Link to={`/inspector/applications/${app.id}`} className="btn btn-primary btn-sm">Review <ArrowRight size={14} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
