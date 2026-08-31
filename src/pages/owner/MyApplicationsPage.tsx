import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { useAuth } from '@/context/AuthContext';
import { getApplicationsByOwner } from '@/services/applicationService';
import { Application } from '@/types';
import { getStatusBadgeClass, formatDate, formatRelative } from '@/lib/utils';
import { Search, Filter, ArrowRight, FileText, Plus } from 'lucide-react';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    getApplicationsByOwner(user.uid).then(apps => { setApplications(apps); setLoading(false); });
  }, [user]);

  const filtered = applications.filter(a => {
    const matchSearch = !search || a.instrumentName.toLowerCase().includes(search.toLowerCase()) || a.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Shell title="My Applications">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">{applications.length} total applications</p>
        </div>
        <Link to="/owner/apply" className="btn btn-primary"><Plus size={16} /> New Application</Link>
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search by name or serial..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} className="empty-state-icon" />
            <div className="empty-state-title">{search || statusFilter !== 'all' ? 'No matching applications' : 'No applications yet'}</div>
            <div className="empty-state-desc">Submit your first instrument verification application.</div>
            {!search && <Link to="/owner/apply" className="btn btn-primary" style={{ marginTop: '1rem' }}><Plus size={16} /> Apply Now</Link>}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Serial No.</th>
                <th>Location</th>
                <th>Status</th>
                <th>AI Check</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{app.instrumentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.instrumentType}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{app.serialNumber}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{app.location || '—'}</td>
                  <td><span className={getStatusBadgeClass(app.status)}>{app.status}</span></td>
                  <td>
                    {app.aiFlagged
                      ? <span className="badge badge-flagged">⚠ Flagged</span>
                      : <span className="badge badge-approved">✓ Clear</span>}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatRelative(app.submittedAt)}</td>
                  <td>
                    <Link to={`/owner/applications/${app.id}`} className="btn btn-ghost btn-sm">
                      Details <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
