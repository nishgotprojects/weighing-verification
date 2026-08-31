import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { useAuth } from '@/context/AuthContext';
import { getAllApplications } from '@/services/applicationService';
import { Application } from '@/types';
import { getStatusBadgeClass, formatRelative } from '@/lib/utils';
import { ClipboardList, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function InspectorDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllApplications().then(apps => { setApplications(apps); setLoading(false); });
  }, []);

  const pending = applications.filter(a => a.status === 'pending');
  const flagged = applications.filter(a => a.aiFlagged && a.status === 'pending');
  const approved = applications.filter(a => a.status === 'approved');
  const rejected = applications.filter(a => a.status === 'rejected');

  return (
    <Shell title="Inspector Dashboard">
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #264f82)', borderRadius: '0.75rem', padding: '1.25rem 1.75rem', marginBottom: '1.5rem', color: 'white' }}>
        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Inspector Dashboard</div>
        <div style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: 4 }}>Welcome, {user?.displayName || user?.email} · Legal Metrology Officer</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Pending Review', count: pending.length, icon: <Clock size={22} color="#d97706" />, bg: '#fef3c7' },
          { label: 'AI Flagged', count: flagged.length, icon: <AlertTriangle size={22} color="#be185d" />, bg: '#fce7f3' },
          { label: 'Approved', count: approved.length, icon: <CheckCircle size={22} color="#16a34a" />, bg: '#dcfce7' },
          { label: 'Rejected', count: rejected.length, icon: <ClipboardList size={22} color="#dc2626" />, bg: '#fee2e2' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{loading ? '—' : s.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Flagged Applications Priority Queue */}
      {flagged.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem', border: '1px solid #fca5a5' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> AI-Flagged Applications (Priority)
            </h3>
            <Link to="/inspector/applications?filter=flagged" className="btn btn-danger btn-sm">Review All</Link>
          </div>
          <table className="data-table">
            <thead><tr><th>Instrument</th><th>Owner</th><th>Serial</th><th>Submitted</th><th></th></tr></thead>
            <tbody>
              {flagged.slice(0, 3).map(app => (
                <tr key={app.id}>
                  <td><div style={{ fontWeight: 500 }}>{app.instrumentName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.instrumentType}</div></td>
                  <td style={{ fontSize: '0.8125rem' }}>{app.ownerEmail}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{app.serialNumber}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatRelative(app.submittedAt)}</td>
                  <td><Link to={`/inspector/applications/${app.id}`} className="btn btn-danger btn-sm">Review <ArrowRight size={14} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Queue */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 600 }}>Pending Applications</h3>
          <Link to="/inspector/applications" className="btn btn-primary btn-sm">View All</Link>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
        ) : pending.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <CheckCircle size={36} className="empty-state-icon" />
            <div className="empty-state-title">All caught up!</div>
            <div className="empty-state-desc">No pending applications to review.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Instrument</th><th>Owner</th><th>AI Check</th><th>Submitted</th><th></th></tr></thead>
            <tbody>
              {pending.slice(0, 8).map(app => (
                <tr key={app.id}>
                  <td><div style={{ fontWeight: 500 }}>{app.instrumentName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.instrumentType}</div></td>
                  <td style={{ fontSize: '0.8125rem' }}>{app.ownerEmail}</td>
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
