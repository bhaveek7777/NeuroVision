import React, { useState } from 'react';
import { ScanEye, Lock, Mail, Shield, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Role } from '../../types';

interface Props { onLoginSuccess: () => void; }

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const { login } = useAttendance();
  const [role, setRole]         = useState<Role>('Teacher');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await login(email, role, password);
    setLoading(false);
    if (authError) {
      setError(authError.toLowerCase().includes('invalid') ? 'Incorrect email or password.' : authError.toLowerCase().includes('confirmed') ? 'Please confirm your email first.' : authError);
      return;
    }
    onLoginSuccess();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
            <ScanEye size={22} style={{ color: '#fff' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx-primary)' }}>NeuroVision</div>
          <div style={{ fontSize: 12, color: 'var(--tx-muted)', marginTop: 4 }}>AI Attendance & Academic Compliance Portal</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 28px', boxShadow: 'var(--shadow-md)' }}>

          {/* Role tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 5, background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 22 }}>
            {(['Teacher', 'Admin'] as Role[]).map(r => (
              <button key={r} type="button" onClick={() => { setRole(r); setError(null); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
                  background: role === r ? 'var(--bg-surface)' : 'transparent',
                  color: role === r ? 'var(--accent)' : 'var(--tx-muted)',
                  boxShadow: role === r ? 'var(--shadow-xs)' : 'none',
                }}>
                {r === 'Teacher' ? <GraduationCap size={14} /> : <Shield size={14} />}
                {r} Portal
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)', fontSize: 12, color: 'var(--danger-text)', marginBottom: 16 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-secondary)', display: 'block', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                <input type="email" required value={email} placeholder="name@college.edu"
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  style={{ width: '100%', padding: '9px 12px 9px 34px', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 13, color: 'var(--tx-primary)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
                <input type="password" required value={password} placeholder="••••••••"
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  style={{ width: '100%', padding: '9px 12px 9px 34px', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 13, color: 'var(--tx-primary)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="nv-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}>
              {loading
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'nv-pulse 0.7s linear infinite' }} />
                : <><span>Sign In to {role} Portal</span><ArrowRight size={14} /></>}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--tx-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          NeuroVision v2.4 · Secured by Supabase Auth
        </div>
      </div>
    </div>
  );
};
