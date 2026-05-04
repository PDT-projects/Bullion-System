import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

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
      console.error('Firebase auth error:', error.code, error.message);
      let errorMessage = 'Login failed. Please try again.';
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Incorrect email or password. Please check your credentials.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Contact your administrator.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #e8edf2 0%, #dde3ea 100%)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo & branding */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}
          >
            <img src="/bullionlogo.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bullion Electronics</h1>
          <p className="text-gray-500 text-sm tracking-wide">Cash Flow Management System</p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          {/* Top accent stripe — dark slate */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #1e293b, #334155, #475569)' }} />

          <div style={{ padding: '32px 36px 36px' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                Welcome Back
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                Sign in to continue to your account
              </p>
            </div>

            {/* Error banner */}
            {errors.general && (
              <div
                style={{
                  marginBottom: '20px',
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#dc2626', fontSize: '13px', fontWeight: 500,
                  padding: '11px 14px', borderRadius: '8px',
                }}
              >
                <span style={{ marginTop: '1px' }}>⚠</span>
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  style={{
                    height: '46px', width: '100%', boxSizing: 'border-box',
                    border: `1.5px solid ${errors.email ? '#fca5a5' : '#e2e8f0'}`,
                    borderRadius: '9px', padding: '0 14px',
                    fontSize: '14px', outline: 'none',
                    background: '#f8fafc', color: '#0f172a',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#334155';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(51,65,85,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = errors.email ? '#fca5a5' : '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.email && (
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#ef4444' }}>⚠ {errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    style={{
                      height: '46px', width: '100%', boxSizing: 'border-box',
                      border: `1.5px solid ${errors.password ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: '9px', paddingLeft: '14px', paddingRight: '46px',
                      fontSize: '14px', outline: 'none',
                      background: '#f8fafc', color: '#0f172a',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#334155';
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(51,65,85,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = errors.password ? '#fca5a5' : '#e2e8f0';
                      e.target.style.background = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    disabled={isLoading}
                    tabIndex={-1}
                    style={{
                      position: 'absolute', right: '13px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, display: 'flex', alignItems: 'center',
                      color: '#94a3b8', zIndex: 10,
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#ef4444' }}>⚠ {errors.password}</p>
                )}
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', height: '48px',
                  background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                  color: '#ffffff',
                  border: 'none', borderRadius: '9px',
                  fontSize: '15px', fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? 'none' : '0 4px 14px rgba(30,41,59,0.35)',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                  letterSpacing: '0.2px',
                }}
                onMouseEnter={e => {
                  if (!isLoading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(30,41,59,0.45)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  if (!isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(30,41,59,0.35)';
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.75s linear infinite',
                    }} />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>

            </form>

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#cbd5e1', marginTop: '24px', marginBottom: 0 }}>
              © Bullion Electronics. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}