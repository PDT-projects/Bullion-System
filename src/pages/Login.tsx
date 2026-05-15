import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  BarChart2,
  ShieldCheck,
  GitBranch,
  Activity,
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (
    user: any,
    role: 'super_admin' | 'user',
    permissions?: string[],
    branch?: string
  ) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);

        setErrors({
          general:
            'Access denied. You are not authorized to use this system.',
        });

        setIsLoading(false);
        return;
      }

      const userData = userDoc.data();

      const rawRole = userData.role as string;

      const role: 'super_admin' | 'user' =
        rawRole === 'super_admin' || rawRole === 'superAdmin'
          ? 'super_admin'
          : 'user';

      const permissions: string[] = userData.permissions || [];
      const branch: string = userData.branch || '';

      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          role,
          permissions,
          branch,
        })
      );

      toast.success('Login successful');

      onLoginSuccess(user, role, permissions, branch);

      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Login failed';

      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Incorrect email or password';
          break;

        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;

        case 'auth/user-disabled':
          errorMessage = 'Account disabled';
          break;

        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts';
          break;

        case 'auth/network-request-failed':
          errorMessage = 'Network error';
          break;
      }

      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      general: undefined,
    }));
  };

  const features = [
    {
      icon: <BarChart2 size={16} />,
      label: 'Financial monitoring',
    },
    {
      icon: <GitBranch size={16} />,
      label: 'Multi-branch management',
    },
    {
      icon: <ShieldCheck size={16} />,
      label: 'Secure access control',
    },
    {
      icon: <Activity size={16} />,
      label: 'Audit & reporting',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        body{
          font-family:'Plus Jakarta Sans',sans-serif;
          overflow:hidden;
        }

        .be-login{
          width:100%;
          height:100vh;
          overflow:hidden;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
          background:
            radial-gradient(circle at top left, rgba(16,185,129,0.08), transparent 25%),
            linear-gradient(135deg,#04111f 0%, #081624 100%);
          position:relative;
        }

        .be-login::before{
          content:'';
          position:absolute;
          inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size:50px 50px;
        }

        .be-container{
          width:100%;
          max-width:1280px;
          height:calc(100vh - 40px);
          max-height:900px;
          border-radius:28px;
          overflow:hidden;
          display:flex;
          position:relative;
          background:rgba(7,16,28,0.72);
          border:1px solid rgba(255,255,255,0.06);
          backdrop-filter:blur(16px);
          box-shadow:0 30px 80px rgba(0,0,0,0.45);
        }

        /* LEFT */

        .be-left{
          flex:1;
          position:relative;
          padding:42px 50px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          overflow:hidden;
        }

        /* SKYLINE */

        .be-skyline{
          position:absolute;
          inset:0;
          pointer-events:none;
          opacity:0.10;
        }

        .tower{
          position:absolute;
          bottom:-10px;
          background:linear-gradient(
            to top,
            rgba(16,185,129,0.45),
            rgba(255,255,255,0.08)
          );
          border-radius:5px 5px 0 0;
          animation:float 6s ease-in-out infinite;
        }

        .t1{
          left:8%;
          width:70px;
          height:300px;
        }

        .t2{
          left:22%;
          width:90px;
          height:200px;
          animation-delay:1s;
        }

        .t3{
          left:40%;
          width:60px;
          height:380px;
          clip-path:polygon(48% 0%,52% 0%,65% 18%,65% 100%,35% 100%,35% 18%);
          animation-delay:2s;
        }

        .t4{
          left:58%;
          width:110px;
          height:250px;
          animation-delay:1.5s;
        }

        .t5{
          left:78%;
          width:70px;
          height:180px;
          animation-delay:0.5s;
        }

        @keyframes float{
          0%,100%{
            transform:translateY(0px);
          }
          50%{
            transform:translateY(-8px);
          }
        }

        /* BRAND */

        .be-brand{
          position:relative;
          z-index:2;
          display:flex;
          align-items:center;
          gap:14px;
          margin-bottom:28px;
        }

        .be-brand-icon{
          width:58px;
          height:58px;
          border-radius:16px;
          background:linear-gradient(135deg,#10b981,#059669);
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          box-shadow:0 10px 30px rgba(16,185,129,0.28);
        }

        .be-brand-name{
          color:#fff;
          font-size:34px;
          line-height:1;
          font-weight:800;
          letter-spacing:-0.04em;
        }

        .be-brand-sub{
          margin-top:8px;
          color:rgba(255,255,255,0.42);
          font-size:11px;
          letter-spacing:0.22em;
          text-transform:uppercase;
        }

        .be-text{
          position:relative;
          z-index:2;
          max-width:520px;
          color:rgba(255,255,255,0.68);
          font-size:16px;
          line-height:1.8;
        }

        /* FEATURES */

        .be-features{
          position:relative;
          z-index:2;
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:16px;
          margin-top:32px;
          max-width:620px;
        }

        .be-feature{
          display:flex;
          align-items:center;
          gap:14px;
          padding:16px;
          border-radius:16px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.05);
          transition:0.25s;
        }

        .be-feature:hover{
          transform:translateY(-2px);
          background:rgba(255,255,255,0.06);
        }

        .be-feature-icon{
          width:42px;
          height:42px;
          border-radius:12px;
          background:rgba(16,185,129,0.12);
          color:#10b981;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        }

        .be-feature span{
          color:rgba(255,255,255,0.82);
          font-size:14px;
          line-height:1.4;
          font-weight:500;
        }

        /* RIGHT */

        .be-right{
          width:460px;
          min-width:460px;
          background:#ffffff;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:38px;
          position:relative;
        }

        .be-right::before{
          content:'';
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:4px;
          background:linear-gradient(
            90deg,
            #10b981 0%,
            #ffffff 50%,
            #ef4444 100%
          );
        }

        .be-card{
          width:100%;
          max-width:340px;
        }

        .be-heading h1{
          font-size:42px;
          color:#0f172a;
          font-weight:800;
          letter-spacing:-0.04em;
          margin-bottom:8px;
        }

        .be-heading p{
          color:#64748b;
          font-size:14px;
          line-height:1.7;
          margin-bottom:30px;
        }

        /* ERROR */

        .be-error{
          padding:14px 16px;
          border-radius:12px;
          background:#fff1f2;
          border:1px solid #fecdd3;
          color:#be123c;
          font-size:13px;
          margin-bottom:18px;
        }

        /* FORM */

        .be-field{
          margin-bottom:18px;
        }

        .be-label{
          display:block;
          margin-bottom:8px;
          font-size:13px;
          font-weight:700;
          color:#1e293b;
        }

        .be-wrap{
          position:relative;
        }

        .be-input{
          width:100%;
          height:52px;
          border-radius:14px;
          border:1.5px solid #e2e8f0;
          background:#f8fafc;
          padding:0 16px;
          font-size:14px;
          color:#0f172a;
          outline:none;
          transition:0.2s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }

        .be-input:focus{
          border-color:#10b981;
          background:#fff;
          box-shadow:0 0 0 4px rgba(16,185,129,0.10);
        }

        .be-input.err{
          border-color:#ef4444;
        }

        .be-input.pr{
          padding-right:46px;
        }

        .be-eye{
          position:absolute;
          top:50%;
          right:14px;
          transform:translateY(-50%);
          background:none;
          border:none;
          color:#94a3b8;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .be-field-err{
          margin-top:7px;
          font-size:12px;
          color:#ef4444;
        }

        /* BUTTON */

        .be-btn{
          width:100%;
          height:54px;
          border:none;
          border-radius:16px;
          margin-top:8px;
          background:#071827;
          color:#fff;
          font-size:15px;
          font-weight:700;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          transition:0.2s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }

        .be-btn:hover:not(:disabled){
          transform:translateY(-2px);
          background:#0b2236;
          box-shadow:0 16px 30px rgba(0,0,0,0.18);
        }

        .be-btn:disabled{
          opacity:0.6;
          cursor:not-allowed;
        }

        .be-spin{
          animation:spin 1s linear infinite;
        }

        @keyframes spin{
          to{
            transform:rotate(360deg);
          }
        }

        .be-secure{
          margin-top:22px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          color:#94a3b8;
          font-size:12px;
        }

        .be-dot{
          width:8px;
          height:8px;
          border-radius:50%;
          background:#10b981;
          box-shadow:0 0 12px rgba(16,185,129,0.7);
        }

        /* MOBILE */

        @media(max-width:900px){

          body{
            overflow:auto;
          }

          .be-login{
            padding:12px;
            height:auto;
          }

          .be-container{
            flex-direction:column;
            height:auto;
          }

          .be-left{
            padding:34px 24px;
          }

          .be-right{
            width:100%;
            min-width:100%;
            padding:34px 22px;
          }

          .be-brand-name{
            font-size:28px;
          }

          .be-features{
            grid-template-columns:1fr;
          }

          .be-text{
            font-size:15px;
            line-height:1.7;
          }

          .be-heading h1{
            font-size:38px;
          }
        }

      `}</style>

      <div className="be-login">

        <div className="be-container">

          {/* LEFT */}

          <div className="be-left">

            <div className="be-skyline">
              <div className="tower t1"></div>
              <div className="tower t2"></div>
              <div className="tower t3"></div>
              <div className="tower t4"></div>
              <div className="tower t5"></div>
            </div>

            <div className="be-brand">

              <div className="be-brand-icon">
                <BarChart2 size={26} />
              </div>

              <div>
                <div className="be-brand-name">
                  BULLION<br />
                  ELECTRONICS
                </div>

                <div className="be-brand-sub">
                  Enterprise Finance System
                </div>
              </div>

            </div>

            <div className="be-text">
              Secure financial management platform built for enterprise operations,
              reporting, branch monitoring and office workflow management across Abu Dhabi.
            </div>

            <div className="be-features">

              {features.map((f) => (
                <div className="be-feature" key={f.label}>

                  <div className="be-feature-icon">
                    {f.icon}
                  </div>

                  <span>{f.label}</span>

                </div>
              ))}

            </div>

          </div>

          {/* RIGHT */}

          <div className="be-right">

            <div className="be-card">

              <div className="be-heading">
                <h1>Welcome</h1>
                <p>
                  Sign in securely to continue
                </p>
              </div>

              {errors.general && (
                <div className="be-error">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                <div className="be-field">

                  <label className="be-label">
                    Email Address
                  </label>

                  <div className="be-wrap">

                    <input
                      type="email"
                      className={`be-input ${errors.email ? 'err' : ''}`}
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />

                  </div>

                  {errors.email && (
                    <div className="be-field-err">
                      {errors.email}
                    </div>
                  )}

                </div>

                <div className="be-field">

                  <label className="be-label">
                    Password
                  </label>

                  <div className="be-wrap">

                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`be-input pr ${errors.password ? 'err' : ''}`}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      placeholder="Enter password"
                      disabled={isLoading}
                    />

                    <button
                      type="button"
                      className="be-eye"
                      onClick={() =>
                        setShowPassword((p) => !p)
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                  {errors.password && (
                    <div className="be-field-err">
                      {errors.password}
                    </div>
                  )}

                </div>

                <button
                  type="submit"
                  className="be-btn"
                  disabled={isLoading}
                >

                  {isLoading ? (
                    <>
                      <Loader2
                        size={18}
                        className="be-spin"
                      />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Secure Sign In
                      <ArrowRight size={16} />
                    </>
                  )}

                </button>

              </form>

              <div className="be-secure">
                <div className="be-dot"></div>
                Secure enterprise connection
              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}