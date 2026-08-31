import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { getApplicationById } from '@/services/applicationService';
import { Application } from '@/types';
import { getStatusBadgeClass, formatDateTime, parseAIResult, generateCertificateUrl } from '@/lib/utils';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Award, MapPin, Calendar, Hash } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getApplicationById(id).then(a => { setApp(a); setLoading(false); });
  }, [id]);

  if (loading) return <Shell title="Application Details"><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div></Shell>;
  if (!app) return <Shell title="Application Details"><div className="alert alert-error">Application not found.</div></Shell>;

  const aiParsed = app.aiRawResult ? parseAIResult(app.aiRawResult) : null;
  const certUrl = generateCertificateUrl(app.id);

  return (
    <Shell title="Application Details">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/owner/applications" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Applications
          </Link>
        </div>

        {/* Header */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>{app.instrumentName}</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>{app.instrumentType}</div>
            </div>
            <span className={getStatusBadgeClass(app.status)} style={{ fontSize: '0.875rem' }}>
              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Hash size={16} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Serial Number</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{app.serialNumber}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MapPin size={16} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</div>
                <div style={{ fontWeight: 500 }}>{app.location || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Calendar size={16} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted</div>
                <div style={{ fontWeight: 500 }}>{formatDateTime(app.submittedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Result */}
        {aiParsed && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 600 }}>AI Pre-Check Result</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', background: app.aiFlagged ? '#fef2f2' : '#f0fdf4', marginBottom: '1rem' }}>
              {app.aiFlagged ? <AlertTriangle size={28} color="var(--error)" /> : <CheckCircle size={28} color="var(--success)" />}
              <div>
                <div style={{ fontWeight: 700, color: app.aiFlagged ? 'var(--error)' : 'var(--success)' }}>
                  {app.aiFlagged ? 'Flagged for Manual Review' : 'Passed AI Pre-Check'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{aiParsed.reason}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Detected Serial', value: aiParsed.detectedSerial },
                { label: 'Serial Match', value: aiParsed.match },
                { label: 'Tamper Signs', value: aiParsed.tamperSigns },
              ].map(i => (
                <div key={i.label} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>{i.label}</div>
                  <div style={{ fontWeight: 600 }}>{i.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspector Notes */}
        {app.inspectorNotes && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><h3 style={{ fontWeight: 600 }}>Inspector Notes</h3></div>
            <p style={{ color: 'var(--text)' }}>{app.inspectorNotes}</p>
            {app.reviewedBy && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 8 }}>Reviewed by: {app.reviewedBy} on {formatDateTime(app.reviewedAt)}</p>}
          </div>
        )}

        {/* Certificate + QR */}
        {app.status === 'approved' && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Award size={20} color="var(--success)" /> Digital Certificate
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Scan this QR code to verify this instrument's certification status.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: 16, background: 'white', border: '1px solid var(--border)', borderRadius: '0.75rem', display: 'inline-block' }}>
                <QRCodeSVG value={certUrl} size={160} />
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 400 }}>
                {certUrl}
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
