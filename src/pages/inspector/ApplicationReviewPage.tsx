import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { useAuth } from '@/context/AuthContext';
import { getApplicationById, updateApplicationStatus } from '@/services/applicationService';
import { Application } from '@/types';
import { getStatusBadgeClass, formatDateTime, parseAIResult } from '@/lib/utils';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Loader2, MapPin, Hash, Calendar, User } from 'lucide-react';

export default function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!id) return;
    getApplicationById(id).then(a => { setApp(a); setLoading(false); });
  }, [id]);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!app || !user) return;
    setSubmitting(decision === 'approved' ? 'approve' : 'reject');
    await updateApplicationStatus(app.id, decision, user.email, notes);
    navigate('/inspector/applications');
  };

  if (loading) return <Shell title="Review Application"><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div></Shell>;
  if (!app) return <Shell title="Review Application"><div className="alert alert-error">Application not found.</div></Shell>;

  const aiParsed = app.aiRawResult ? parseAIResult(app.aiRawResult) : null;
  const alreadyDecided = app.status !== 'pending';

  return (
    <Shell title="Review Application">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/inspector/applications" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Applications
          </Link>
        </div>

        {alreadyDecided && (
          <div className={`alert ${app.status === 'approved' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
            This application has already been <strong>{app.status}</strong>.
          </div>
        )}

        {/* Instrument Info */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>{app.instrumentName}</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{app.instrumentType}</div>
            </div>
            <span className={getStatusBadgeClass(app.status)}>{app.status}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {[
              { icon: <Hash size={15} />, label: 'Serial Number', value: app.serialNumber },
              { icon: <MapPin size={15} />, label: 'Location', value: app.location || '—' },
              { icon: <User size={15} />, label: 'Owner', value: app.ownerEmail },
              { icon: <Calendar size={15} />, label: 'Submitted', value: formatDateTime(app.submittedAt) },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)', marginTop: 2 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
                  <div style={{ fontWeight: 500, fontFamily: item.label === 'Serial Number' ? 'monospace' : 'inherit' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        {aiParsed && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                {app.aiFlagged ? <AlertTriangle size={18} color="var(--error)" /> : <CheckCircle size={18} color="var(--success)" />}
                AI Pre-Check Analysis
              </h3>
            </div>

            <div style={{ padding: '0.875rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', background: app.aiFlagged ? '#fef2f2' : '#f0fdf4', border: `1px solid ${app.aiFlagged ? '#fca5a5' : '#86efac'}` }}>
              <div style={{ fontWeight: 700, color: app.aiFlagged ? 'var(--error)' : 'var(--success)' }}>
                {app.aiFlagged ? '⚠ AI has flagged this application for potential issues' : '✓ AI pre-check passed — no issues detected'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{aiParsed.reason}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Detected Serial', value: aiParsed.detectedSerial },
                { label: 'Serial Match', value: aiParsed.match, highlight: true },
                { label: 'Tamper Signs', value: aiParsed.tamperSigns, highlight: true },
              ].map(i => (
                <div key={i.label} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>{i.label}</div>
                  <div style={{ fontWeight: 600, color: i.highlight && (i.value === 'NO' || i.value === 'YES') ? (i.value === 'YES' && i.label === 'Tamper Signs' ? 'var(--error)' : i.value === 'NO' && i.label === 'Serial Match' ? 'var(--error)' : 'var(--success)') : 'var(--text)' }}>
                    {i.value}
                  </div>
                </div>
              ))}
            </div>

            <details>
              <summary style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer' }}>View raw AI output</summary>
              <pre style={{ marginTop: 8, padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.75rem', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{app.aiRawResult}</pre>
            </details>
          </div>
        )}

        {/* Decision */}
        {!alreadyDecided && (
          <div className="card">
            <div className="card-header"><h3 style={{ fontWeight: 600 }}>Your Decision</h3></div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Inspector Notes</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Add your inspection notes, observations, or reasons for your decision..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-success"
                style={{ flex: 1, justifyContent: 'center', fontSize: '1rem', padding: '0.75rem' }}
                onClick={() => handleDecision('approved')}
                disabled={!!submitting}
              >
                {submitting === 'approve' ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CheckCircle size={18} />}
                Approve Application
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: 'center', fontSize: '1rem', padding: '0.75rem' }}
                onClick={() => handleDecision('rejected')}
                disabled={!!submitting}
              >
                {submitting === 'reject' ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> : <XCircle size={18} />}
                Reject Application
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
