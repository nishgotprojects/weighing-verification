import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { UserRole } from '@/types';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await signup(email, password, role, name);
      navigate('/owner/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('email-already-in-use') ? 'This email is already registered.' : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div style={{ width: 44, height: 44, borderRadius: '0.625rem', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--navy)' }}>LM Verify</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Legal Metrology Division</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.375rem' }}>Create your account</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>Register to apply for instrument verification</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="owner">Business Owner / Instrument Owner</option>
              <option value="inspector">Inspector / LMO Officer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading && <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
