import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getApplicationById } from '@/services/applicationService';
import { Application } from '@/types';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, CheckCircle, XCircle, Scale, MapPin, Hash, Calendar, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRVerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    getApplicationById(id).then(a => {
      if (!a) setNotFound(true);
      else setApp(a);
      setLoading(false);
    });
  }, [id]);

  const isApproved = app?.status === 'approved';
  const expiry = app?.submittedAt ? new Date(app.submittedAt.getFullYear() + 1, app.submittedAt.getMonth(), app.submittedAt.getDate()) : null;
  const isExpired = expiry ? expiry < new Date() : false;
  const certUrl = `${window.location.origin}/verify/${id}`;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '0.625rem', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={24} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--navy)' }}>Legal Metrology · Certificate Verification</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ministry of Consumer Affairs, Food & Public Distribution · Government of India</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: 520, width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
            <div className="spinner" />
            <div style={{ color: 'var(--text-muted)' }}>Verifying certificate...</div>
          </div>
        ) : notFound || !app ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <XCircle size={64} color="var(--error)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--error)', marginBottom: '0.5rem' }}>Certificate Not Found</h2>
            <p style={{ color: 'var(--text-muted)' }}>This certificate ID is invalid or the instrument has not been verified.</p>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div style={{
              padding: '1.75rem 2rem',
              background: isApproved && !isExpired ? '#16a34a' : '#dc2626',
              color: 'white', textAlign: 'center',
            }}>
              {isApproved && !isExpired ? (
                <>
                  <CheckCircle size={56} style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>VERIFIED</div>
                  <div style={{ opacity: 0.85, fontSize: '0.875rem', marginTop: 4 }}>This instrument is legally verified and compliant</div>
                </>
              ) : (
                <>
                  <XCircle size={56} style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                    {!isApproved ? 'NOT VERIFIED' : 'CERTIFICATE EXPIRED'}
                  </div>
                  <div style={{ opacity: 0.85, fontSize: '0.875rem', marginTop: 4 }}>
                    {!isApproved ? 'This instrument has not been approved by a Legal Metrology Officer.' : 'This certificate has expired. Re-verification required.'}
                  </div>
                </>
              )}
            </div>

            {/* Details */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: <Scale size={16} />, label: 'Instrument Name', value: app.instrumentName },
                  { icon: <Scale size={16} />, label: 'Instrument Type', value: app.instrumentType || '—' },
                  { icon: <Hash size={16} />, label: 'Serial Number', value: app.serialNumber, mono: true },
                  { icon: <MapPin size={16} />, label: 'Location', value: app.location || '—' },
                  { icon: <Calendar size={16} />, label: 'Verified Date', value: formatDate(app.submittedAt) },
                  { icon: <Calendar size={16} />, label: 'Valid Until', value: formatDate(expiry), highlight: isExpired ? 'red' : 'green' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', paddingBottom: '0.875rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: 'var(--text-muted)', marginTop: 2 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
                      <div style={{ fontWeight: 600, fontFamily: item.mono ? 'monospace' : 'inherit', color: item.highlight ?? 'var(--text)' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {app.aiFlagged && (
                <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
                  <AlertTriangle size={16} />
                  <span>This instrument was flagged during AI pre-check but approved by a certified officer after physical inspection.</span>
                </div>
              )}

              {/* QR */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.625rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Certificate QR Code</div>
                <QRCodeSVG value={certUrl} size={100} />
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-all' }}>{certUrl}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
        Legal Metrology Act, 2009 · Government of India · SIH 2026
      </div>
    </div>
  );
}
