import { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { getAllApplications } from '@/services/applicationService';
import { Application } from '@/types';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function AIAlertsPage() {
  const [flagged, setFlagged] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllApplications().then(apps => {
      setFlagged(apps.filter(a => a.aiFlagged));
      setLoading(false);
    });
  }, []);

  return (
    <Shell title="AI Alerts">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Anomaly Alerts</h1>
          <p className="page-subtitle">Applications flagged by AI for potential tampering or serial mismatch</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); getAllApplications().then(apps => { setFlagged(apps.filter(a => a.aiFlagged)); setLoading(false); }); }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {flagged.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={16} />
          <strong>{flagged.length} application{flagged.length !== 1 ? 's' : ''} flagged</strong> — These require manual inspector review.
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : flagged.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} className="empty-state-icon" />
            <div className="empty-state-title">No AI alerts</div>
            <div className="empty-state-desc">All applications have passed AI pre-checks.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {flagged.map(app => {
              const lines = app.aiRawResult?.split('\n') ?? [];
              const get = (key: string) => lines.find(l => l.startsWith(key))?.split(':').slice(1).join(':').trim() ?? '—';
              return (
                <div key={app.id} style={{ padding: '1rem', border: '1px solid #fca5a5', borderRadius: '0.625rem', background: '#fef2f2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--error)' }}>{app.instrumentName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{app.ownerEmail} · {formatDateTime(app.submittedAt)}</div>
                    </div>
                    <span className={`badge ${app.status === 'approved' ? 'badge-approved' : app.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>{app.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {[
                      { label: 'Match', value: get('MATCH') },
                      { label: 'Tamper', value: get('TAMPER_SIGNS') },
                      { label: 'Detected Serial', value: get('DETECTED_SERIAL') },
                    ].map(i => (
                      <div key={i.label} style={{ padding: '0.5rem 0.75rem', background: 'white', borderRadius: '0.375rem', border: '1px solid #fca5a5' }}>
                        <div style={{ fontSize: '0.6875rem', color: '#7f1d1d', fontWeight: 600, textTransform: 'uppercase' }}>{i.label}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--error)' }}>{i.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#7f1d1d', marginBottom: '0.75rem' }}><strong>AI Reason:</strong> {get('REASON')}</div>
                  <Link to={`/inspector/applications/${app.id}`} className="btn btn-danger btn-sm">Review Application →</Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
