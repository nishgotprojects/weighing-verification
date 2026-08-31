import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { useAuth } from '@/context/AuthContext';
import { analyzeInstrument } from '@/services/aiService';
import { createApplication } from '@/services/applicationService';
import { parseAIResult } from '@/lib/utils';
import { Upload, Camera, Loader2, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

type Step = 'form' | 'analyzing' | 'result' | 'submitting' | 'done';

export default function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({
    instrumentName: '',
    instrumentType: '',
    serialNumber: '',
    location: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [aiResult, setAiResult] = useState<ReturnType<typeof parseAIResult> | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [aiRaw, setAiRaw] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // base64 without prefix
      setImageBase64(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!formData.instrumentName.trim() || !formData.serialNumber.trim()) {
      setError('Please fill in Instrument Name and Serial Number.');
      return;
    }
    if (!imageFile || !imageBase64) {
      setError('Please upload a photo of the instrument.');
      return;
    }
    setError('');
    setStep('analyzing');
    try {
      const result = await analyzeInstrument(imageBase64, formData.serialNumber.trim());
      const parsed = parseAIResult(result.raw_result);
      setAiResult(parsed);
      setFlagged(result.flagged);
      setAiRaw(result.raw_result);
      setStep('result');
    } catch (err: any) {
      setError(err?.message || 'AI analysis failed. Please ensure the backend is running.');
      setStep('form');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError('');
    setStep('submitting');
    try {
      await createApplication({
        ownerEmail: user.email,
        ownerId: user.uid,
        instrumentName: formData.instrumentName.trim(),
        instrumentType: formData.instrumentType,
        serialNumber: formData.serialNumber.trim(),
        location: formData.location.trim(),
        status: 'pending',
        aiFlagged: flagged,
        aiRawResult: aiRaw,
      });
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Submission failed. Please try again.');
      setStep('result');
    }
  };

  return (
    <Shell title="Apply for Verification">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          {['Fill Form', 'AI Check', 'Submit'].map((s, i) => {
            const stepIdx = step === 'form' ? 0 : step === 'analyzing' || step === 'result' ? 1 : 2;
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: i < 2 ? 1 : 'none' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: done ? 'var(--success)' : active ? 'var(--blue)' : '#e2e8f0',
                  color: done || active ? 'white' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {done ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s}</span>
                {i < 2 && <div style={{ flex: 1, height: 2, background: done ? 'var(--success)' : '#e2e8f0', borderRadius: 1 }} />}
              </div>
            );
          })}
        </div>

        {/* STEP: Form */}
        {(step === 'form' || step === 'analyzing') && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontWeight: 600 }}>Instrument Details</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Fill in the details of the instrument you want to get verified.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Instrument Name *</label>
                <input className="form-input" placeholder="e.g., Platform Weighing Scale" value={formData.instrumentName} onChange={e => setFormData(f => ({ ...f, instrumentName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Instrument Type *</label>
                <select className="form-input" value={formData.instrumentType} onChange={e => setFormData(f => ({ ...f, instrumentType: e.target.value }))}>
                  <option value="">Select type</option>
                  <option>Weighing Scale</option>
                  <option>Precision Balance</option>
                  <option>Petrol Pump Dispenser</option>
                  <option>Flow Meter</option>
                  <option>Taxi Meter</option>
                  <option>Medical Weighing Scale</option>
                  <option>Milk Meter</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number *</label>
                <input className="form-input" placeholder="As shown on nameplate" value={formData.serialNumber} onChange={e => setFormData(f => ({ ...f, serialNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Location / Address</label>
                <input className="form-input" placeholder="Business address" value={formData.location} onChange={e => setFormData(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>

            {/* Image upload */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Instrument Photo *</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)', borderRadius: '0.625rem', padding: '2rem',
                  textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
                  background: imagePreview ? '#f8fafc' : 'white',
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: '0.5rem', objectFit: 'contain' }} />
                ) : (
                  <>
                    <Camera size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Click to upload or drag & drop</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>JPG, PNG, WEBP up to 10MB</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
              {imageFile && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={16} />
              <span>Our AI will automatically check the serial number on the instrument photo against your declared serial number and look for signs of tampering.</span>
            </div>

            <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={step === 'analyzing'} style={{ width: '100%', justifyContent: 'center' }}>
              {step === 'analyzing' ? (
                <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Analyzing with AI...</>
              ) : (
                <><Upload size={18} /> Run AI Pre-Check & Continue</>
              )}
            </button>
          </div>
        )}

        {/* STEP: Result */}
        {step === 'result' && aiResult && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontWeight: 600 }}>AI Pre-Check Result</h3>
            </div>

            <div style={{
              padding: '1.25rem', borderRadius: '0.625rem', marginBottom: '1.25rem',
              background: flagged ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${flagged ? '#fca5a5' : '#86efac'}`,
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
            }}>
              {flagged
                ? <AlertTriangle size={32} color="var(--error)" style={{ flexShrink: 0 }} />
                : <CheckCircle size={32} color="var(--success)" style={{ flexShrink: 0 }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: flagged ? 'var(--error)' : 'var(--success)', marginBottom: 4 }}>
                  {flagged ? 'AI Flagged — Requires Manual Review' : 'AI Pre-Check Passed'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {flagged
                    ? 'Your application will be marked for extra scrutiny. You can still submit — an inspector will review it.'
                    : 'Serial number verified and no tampering detected. Your application is ready to submit.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Detected Serial', value: aiResult.detectedSerial },
                { label: 'Serial Match', value: aiResult.match },
                { label: 'Tamper Signs', value: aiResult.tamperSigns },
                { label: 'AI Reason', value: aiResult.reason },
              ].map(item => (
                <div key={item.label} style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep('form')} style={{ flex: 1, justifyContent: 'center' }}>
                ← Edit Details
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2, justifyContent: 'center' }}>
                Submit Application <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP: Submitting */}
        {step === 'submitting' && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 size={48} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--blue)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Submitting Application...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Saving to Firestore...</p>
          </div>
        )}

        {/* STEP: Done */}
        {step === 'done' && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: 8 }}>Application Submitted!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
              Your application has been submitted and is pending inspector review. You'll be notified when it's processed.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setStep('form'); setFormData({ instrumentName: '', instrumentType: '', serialNumber: '', location: '' }); setImageFile(null); setImagePreview(null); }}>
                Submit Another
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/owner/applications')}>
                View My Applications <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
