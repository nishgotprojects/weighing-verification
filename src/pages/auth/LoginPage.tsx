import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/owner/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg.includes('invalid-credential') || msg.includes('wrong-password')
        ? 'Invalid email or password.'
        : msg.includes('user-not-found')
        ? 'No account found with this email.'
        : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-logo">
          <div style={{
            width: 44, height: 44, borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--navy)' }}>LM Verify</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Legal Metrology Division</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.375rem' }}>
          Sign in to your account
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          Online Verification System for Weighing & Measuring Instruments
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--blue)', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
            Create account
          </Link>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Government of India · Ministry of Consumer Affairs<br />
          Legal Metrology Division · SIH 2026
        </div>
      </div>
    </div>
  );
}
