import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await signup(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,92,252,0.15), transparent)',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 0.3s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px',
            boxShadow: '0 0 40px var(--accent-glow)'
          }}>⚡</div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 6 }}>TaskFlow</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Team task management, simplified.</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg)', borderRadius: 8,
            padding: 4, marginBottom: 28, border: '1px solid var(--border)'
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 6,
                  background: mode === m ? 'var(--bg-2)' : 'transparent',
                  border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text-3)',
                  fontWeight: mode === m ? 500 : 400,
                  fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                  textTransform: 'capitalize'
                }}>
                {m}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Full Name</label>
              <input className="input" placeholder="John Doe"
                value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => update('email', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => update('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Role</label>
              <select className="input" value={form.role} onChange={e => update('role', e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: 'var(--red)', fontSize: 13
            }}>{error}</div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 0' }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-3)', fontSize: 12 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span style={{ color: 'var(--accent-2)', cursor: 'pointer' }}
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-3)', fontSize: 11 }}>
          First user to sign up becomes the Admin.
        </p>
      </div>
    </div>
  );
}
