import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { useAuth } from '@/context/AuthContext';
import { getApplicationsByOwner } from '@/services/applicationService';
import { Application } from '@/types';
import { getStatusBadgeClass, formatDate, formatRelative } from '@/lib/utils';
import {
  FileText, CheckCircle, Clock, AlertTriangle,
  Plus, ArrowRight, Scale, Award,
} from 'lucide-react';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getApplicationsByOwner(user.uid).then(apps => {
      setApplications(apps);
      setLoading(false);
    });
  }, [user]);

  const total = applications.length;
  const pending = applications.filter(a => a.status === 'pending').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const flagged = applications.filter(a => a.aiFlagged).length;
  const recent = applications.slice(0, 5);

  return (
    <Shell title="Owner Dashboard">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #264f82 100%)',
        borderRadius: '0.75rem', padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.5rem', color: 'white',
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700 }}>
            {user?.displayName || user?.email}
          </div>
          <div style={{ fontSize: '0.8125rem', opacity: 0.6, marginTop: 4 }}>
            Legal Metrology — Instrument Verification Portal
          </div>
        </div>
        <Link to="/owner/apply" className="btn" style={{ background: 'white', color: 'var(--navy)', fontWeight: 600 }}>
          <Plus size={16} /> Apply for Verification
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}><FileText size={22} color="#2563eb" /></div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Total Applications</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{loading ? '—' : total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}><Clock size={22} color="#d97706" /></div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Pending Review</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{loading ? '—' : pending}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}><CheckCircle size={22} color="#16a34a" /></div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Approved</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{loading ? '—' : approved}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3' }}><AlertTriangle size={22} color="#be185d" /></div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>AI Flagged</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{loading ? '—' : flagged}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem' }}>
        {/* Recent Applications */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Recent Applications</h3>
            <Link to="/owner/applications" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--blue)', textDecoration: 'none' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <Scale size={40} className="empty-state-icon" />
              <div className="empty-state-title">No applications yet</div>
              <div className="empty-state-desc">Submit your first instrument verification application to get started.</div>
              <Link to="/owner/apply" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                <Plus size={16} /> Apply Now
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Serial No.</th>
                  <th>Status</th>
                  <th>AI Check</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{app.instrumentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.instrumentType}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{app.serialNumber}</td>
                    <td><span className={getStatusBadgeClass(app.status)}>{app.status}</span></td>
                    <td>
                      {app.aiFlagged
                        ? <span className="badge badge-flagged">⚠ Flagged</span>
                        : <span className="badge badge-approved">✓ Clear</span>}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatRelative(app.submittedAt)}</td>
                    <td>
                      <Link to={`/owner/applications/${app.id}`} className="btn btn-ghost btn-sm">
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 220 }}>
          <div className="card" style={{ background: 'var(--navy)', border: 'none', color: 'white' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <Link to="/owner/apply" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', justifyContent: 'flex-start' }}>
                <Plus size={15} /> New Application
              </Link>
              <Link to="/owner/certificates" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', justifyContent: 'flex-start' }}>
                <Award size={15} /> My Certificates
              </Link>
              <Link to="/owner/marketplace" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', justifyContent: 'flex-start' }}>
                <Scale size={15} /> Marketplace
              </Link>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>Verification Status</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Approved', count: approved, color: 'var(--success)', bg: '#dcfce7' },
                { label: 'Pending', count: pending, color: 'var(--warning)', bg: '#fef3c7' },
                { label: 'Flagged', count: flagged, color: '#be185d', bg: '#fce7f3' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.625rem', background: item.bg, borderRadius: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: item.color, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: item.color }}>{loading ? '—' : item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
