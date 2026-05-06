import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Eye, EyeOff, ArrowRight, Loader2,
  BarChart2, ShieldCheck, GitBranch, Activity, Zap
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, role: 'super_admin' | 'user', permissions?: string[], branch?: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        setErrors({ general: 'Access denied. You are not authorized to use this system.' });
        setIsLoading(false);
        return;
      }
      const userData = userDoc.data();
      const rawRole = userData.role as string;
      const role: 'super_admin' | 'user' =
        rawRole === 'super_admin' || rawRole === 'superAdmin' ? 'super_admin' : 'user';
      const permissions: string[] = userData.permissions || [];
      const branch: string = userData.branch || '';
      localStorage.setItem('userInfo', JSON.stringify({ uid: user.uid, email: user.email, role, permissions, branch }));
      toast.success('Login successful!');
      onLoginSuccess(user, role, permissions, branch);
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Incorrect email or password. Please check your credentials.'; break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.'; break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Contact your administrator.'; break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.'; break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.'; break;
      }
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const features = [
    { icon: <BarChart2 size={16} />,  label: 'Real-time cash flow monitoring' },
    { icon: <GitBranch size={16} />,  label: 'Multi-branch management' },
    { icon: <ShieldCheck size={16} />, label: 'Role-based access control' },
    { icon: <Activity size={16} />,   label: 'Comprehensive audit trail' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .be-login {
          min-height: 100vh;
          display: flex;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f0f2f5;
        }

        /* ── LEFT PANEL ── */
        .be-left {
          width: 400px;
          flex-shrink: 0;
          background: #1a1f2e;
          display: flex;
          flex-direction: column;
          padding: 48px 40px;
          position: relative;
          overflow: hidden;
        }
        /* dot-grid texture */
        .be-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }
        /* teal glow bottom-left */
        .be-left::after {
          content: '';
          position: absolute;
          bottom: -100px; left: -80px;
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Brand */
        .be-brand {
          display: flex; align-items: center; gap: 13px;
          margin-bottom: 60px;
          position: relative; z-index: 1;
        }
        .be-brand-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(16,185,129,0.38);
          color: #fff;
          flex-shrink: 0;
        }
        .be-brand-name {
          font-size: 15px; font-weight: 800;
          color: #fff; letter-spacing: -0.02em; line-height: 1.2;
        }
        .be-brand-sub {
          font-size: 11px; color: rgba(255,255,255,0.35);
          font-weight: 400; margin-top: 3px;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        /* Hero */
        .be-hero { position: relative; z-index: 1; flex: 1; }
        .be-hero h2 {
          font-size: 27px; font-weight: 800;
          color: #fff; line-height: 1.22;
          letter-spacing: -0.03em; margin-bottom: 14px;
        }
        .be-hero h2 em { font-style: normal; color: #10b981; }
        .be-hero p {
          font-size: 13px; color: rgba(255,255,255,0.4);
          line-height: 1.75; font-weight: 400;
          max-width: 290px; margin-bottom: 40px;
        }

        /* Feature list */
        .be-features { display: flex; flex-direction: column; gap: 10px; }
        .be-feature {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px;
          transition: background 0.2s;
        }
        .be-feature:hover { background: rgba(255,255,255,0.08); }
        .be-feature-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(16,185,129,0.15);
          color: #10b981;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .be-feature span {
          font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 400;
        }

        .be-left-footer {
          position: relative; z-index: 1;
          margin-top: 44px;
          font-size: 11px; color: rgba(255,255,255,0.18);
        }

        /* ── RIGHT PANEL ── */
        .be-right {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 24px;
          background: #f0f2f5;
          position: relative;
        }
        .be-right::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* Card */
        .be-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 400px;
          background: #fff;
          border-radius: 16px;
          padding: 40px 36px 36px;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.06),
            0 8px 32px rgba(0,0,0,0.09),
            0 0 0 1px rgba(0,0,0,0.04);
          animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Teal-to-navy accent bar on top of card */
        .be-accent {
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #10b981 0%, #1a1f2e 100%);
          border-radius: 16px 16px 0 0;
        }

        /* Mobile-only brand (left panel hidden on small screens) */
        .be-card-brand {
          display: none;
          align-items: center; gap: 11px;
          margin-bottom: 28px; padding-bottom: 20px;
          border-bottom: 1px solid #f1f3f5;
        }
        @media (max-width: 767px) {
          .be-left { display: none; }
          .be-card-brand { display: flex; }
        }
        .be-card-brand-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .be-card-brand-name { font-size: 14px; font-weight: 700; color: #1a1f2e; }

        /* Heading */
        .be-heading { margin-bottom: 28px; }
        .be-heading h1 {
          font-size: 22px; font-weight: 800;
          color: #1a1f2e; letter-spacing: -0.03em; margin-bottom: 5px;
        }
        .be-heading p { font-size: 13px; color: #8b95a1; font-weight: 400; }

        /* Error */
        .be-error {
          display: flex; align-items: flex-start; gap: 9px;
          background: #fff5f5; border: 1px solid #fecaca;
          border-left: 3px solid #ef4444;
          border-radius: 8px; padding: 11px 14px; margin-bottom: 20px;
        }
        .be-error-ico { color: #ef4444; flex-shrink: 0; margin-top: 1px; }
        .be-error span { font-size: 13px; color: #b91c1c; line-height: 1.5; }

        /* Fields */
        .be-field { margin-bottom: 18px; }
        .be-label {
          display: block; font-size: 12px; font-weight: 600;
          color: #374151; margin-bottom: 7px; letter-spacing: 0.01em;
        }
        .be-wrap { position: relative; }
        .be-input {
          width: 100%; height: 44px;
          border: 1.5px solid #e5e7eb; border-radius: 9px;
          padding: 0 14px; font-size: 13.5px; color: #111827;
          background: #fafafa; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 400;
        }
        .be-input::placeholder { color: #c0c7d0; }
        .be-input:focus {
          border-color: #10b981; background: #fff;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
        }
        .be-input.err {
          border-color: #fca5a5; background: #fff;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }
        .be-input.pr { padding-right: 44px; }
        .be-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px;
          color: #9ca3af; display: flex; align-items: center;
          transition: color 0.15s;
        }
        .be-eye:hover { color: #374151; }
        .be-field-err {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: #ef4444; margin-top: 5px; font-weight: 500;
        }

        /* Submit */
        .be-btn {
          width: 100%; height: 44px;
          background: #1a1f2e; border: none; border-radius: 9px;
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 24px;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          letter-spacing: -0.01em;
          position: relative; overflow: hidden;
        }
        .be-btn::before {
          content: '';
          position: absolute; left: 0; top: 0;
          width: 4px; height: 100%;
          background: #10b981;
          transition: width 0.25s ease;
        }
        .be-btn:hover:not(:disabled)::before { width: 7px; }
        .be-btn:hover:not(:disabled) {
          background: #0f1420;
          box-shadow: 0 4px 18px rgba(26,31,46,0.22);
          transform: translateY(-1px);
        }
        .be-btn:active:not(:disabled) { transform: translateY(0); }
        .be-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .be-spin { animation: spin 0.75s linear infinite; }

        /* Divider & secure badge */
        .be-divider {
          display: flex; align-items: center; gap: 10px; margin-top: 22px;
        }
        .be-div-line { flex: 1; height: 1px; background: #f1f3f5; }
        .be-div-txt {
          font-size: 11px; color: #c0c7d0;
          font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;
        }
        .be-secure {
          display: flex; align-items: center; justify-content: center;
          gap: 7px; margin-top: 16px;
        }
        .be-secure span { font-size: 11px; color: #b0b8c4; font-weight: 400; }
        .be-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.55);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .be-footer {
          position: relative; z-index: 1;
          margin-top: 28px;
          font-size: 11px; color: #b0b8c4; text-align: center;
        }
      `}</style>

      <div className="be-login">

        {/* ── LEFT PANEL ── */}
        <div className="be-left">
          <div className="be-brand">
            <div className="be-brand-icon">
              <BarChart2 size={22} />
            </div>
            <div>
              <div className="be-brand-name">Bullion Electronics</div>
              <div className="be-brand-sub">Cash Flow Management</div>
            </div>
          </div>

          <div className="be-hero">
            <h2>Smarter finance,<br /><em>better decisions.</em></h2>
            <p>A unified platform to manage cash flow, branches, transactions and reporting — built for your team.</p>

            <div className="be-features">
              {features.map((f) => (
                <div className="be-feature" key={f.label}>
                  <div className="be-feature-icon">{f.icon}</div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="be-left-footer">© 2026 Bullion Electronics. All rights reserved.</div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="be-right">
          <div className="be-card">
            <div className="be-accent" />

            {/* Mobile brand */}
            <div className="be-card-brand">
              <div className="be-card-brand-icon">
                <BarChart2 size={18} />
              </div>
              <div className="be-card-brand-name">Bullion Electronics</div>
            </div>

            <div className="be-heading">
              <h1>Welcome back</h1>
              <p>Sign in to continue to your account</p>
            </div>

            {errors.general && (
              <div className="be-error">
                <svg className="be-error-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="be-field">
                <label className="be-label">Email Address</label>
                <div className="be-wrap">
                  <input
                    type="email"
                    className={`be-input${errors.email ? ' err' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <div className="be-field-err">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="be-field">
                <label className="be-label">Password</label>
                <div className="be-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`be-input pr${errors.password ? ' err' : ''}`}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="be-eye"
                    onClick={() => setShowPassword(p => !p)}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="be-field-err">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {errors.password}
                  </div>
                )}
              </div>

              <button type="submit" className="be-btn" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 size={15} className="be-spin" /> Signing in…</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="be-divider">
              <div className="be-div-line" />
              <span className="be-div-txt">Secure Access</span>
              <div className="be-div-line" />
            </div>

            <div className="be-secure">
              <div className="be-dot" />
              <span>256-bit encrypted · Live connection</span>
            </div>
          </div>

          <div className="be-footer">© 2026 Bullion Electronics. All rights reserved.</div>
        </div>

      </div>
    </>
  );
}