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
          background:#000;
        }

        .be-login{
          width:100%;
          height:100vh;
          overflow:hidden;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:18px;
          background:
            radial-gradient(circle at top left, rgba(212,175,55,0.10), transparent 25%),
            radial-gradient(circle at bottom right, rgba(212,175,55,0.06), transparent 25%),
            #050505;
          position:relative;
        }

        .be-login::before{
          content:'';
          position:absolute;
          inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size:55px 55px;
          opacity:0.35;
        }

        .be-container{
          width:100%;
          max-width:1450px;
          height:calc(100vh - 36px);
          max-height:920px;
          border-radius:32px;
          overflow:hidden;
          display:flex;
          position:relative;
          background:#0a0a0a;
          border:1px solid rgba(212,175,55,0.18);
          box-shadow:
            0 30px 80px rgba(0,0,0,0.7),
            0 0 0 1px rgba(255,255,255,0.02);
        }

        /* LEFT PANEL */

        .be-left{
          flex:1;
          position:relative;
          padding:52px 58px;
          display:flex;
          flex-direction:column;
          justify-content:flex-start;
          overflow:hidden;
          background:
            linear-gradient(
              135deg,
              rgba(12,12,12,0.98) 0%,
              rgba(0,0,0,0.96) 100%
            );
        }

        .be-left::after{
          content:'';
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at top center, rgba(212,175,55,0.07), transparent 35%);
          pointer-events:none;
        }

        /* SKYLINE */

        .be-skyline{
          position:absolute;
          left:0;
          right:0;
          bottom:0;
          height:100%;
          pointer-events:none;
          opacity:0.5;
          display:flex;
          align-items:flex-end;
          justify-content:flex-start;
          z-index:1;
        }

        .be-skyline svg {
          width:100%;
          height:100%;
          object-fit:cover;
        }

        /* BRAND */

        .be-brand{
          position:relative;
          z-index:2;
          display:flex;
          align-items:flex-start;
          gap:18px;
          margin-bottom:34px;
          margin-top:10px;
        }

        .be-brand-logo{
          width:96px;
          height:96px;
          border-radius:20px;
          overflow:hidden;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          background:#fff;
          border:2.5px solid #000;
          margin-top:6px;
          box-shadow:
            0 4px 20px rgba(0,0,0,0.6),
            0 1px 4px rgba(0,0,0,0.4);
        }

        .be-brand-logo img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .be-brand-name{
          color:#ffffff;
          font-size:56px;
          line-height:0.92;
          font-weight:800;
          letter-spacing:-0.06em;
        }

        .be-brand-name span{
          background:linear-gradient(
            135deg,
            #f8e08e 0%,
            #d4af37 45%,
            #b8860b 100%
          );
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
        }

        .be-brand-sub{
          margin-top:12px;
          color:rgba(255,255,255,0.45);
          font-size:12px;
          letter-spacing:0.32em;
          text-transform:uppercase;
        }

        .be-text{
          position:relative;
          z-index:2;
          max-width:620px;
          color:rgba(255,255,255,0.70);
          font-size:20px;
          line-height:1.9;
          margin-top:8px;
        }

        /* FEATURES */

        .be-features{
          position:relative;
          z-index:2;
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:18px;
          margin-top:42px;
          max-width:700px;
        }

        .be-feature{
          display:flex;
          align-items:center;
          gap:16px;
          padding:18px;
          border-radius:22px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.05);
          backdrop-filter:blur(10px);
          transition:0.25s ease;
        }

        .be-feature:hover{
          transform:translateY(-3px);
          border-color:rgba(212,175,55,0.25);
          background:rgba(255,255,255,0.05);
          box-shadow:0 10px 30px rgba(0,0,0,0.25);
        }

        .be-feature-icon{
          width:48px;
          height:48px;
          border-radius:15px;
          background:rgba(212,175,55,0.12);
          color:#d4af37;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          border:1px solid rgba(212,175,55,0.18);
        }

        .be-feature span{
          color:rgba(255,255,255,0.9);
          font-size:15px;
          line-height:1.4;
          font-weight:600;
        }

        /* RIGHT PANEL */

        .be-right{
          width:500px;
          min-width:500px;
          background:#ffffff;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:42px;
          position:relative;
          z-index:2;
        }

        .be-right::before{
          content:'';
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:5px;
          background:linear-gradient(
            90deg,
            #f8e08e 0%,
            #d4af37 45%,
            #b8860b 100%
          );
        }

        .be-card{
          width:100%;
          max-width:360px;
        }

        .be-heading h1{
          font-size:64px;
          color:#000;
          font-weight:800;
          letter-spacing:-0.06em;
          margin-bottom:10px;
        }

        .be-heading p{
          color:#6b7280;
          font-size:17px;
          line-height:1.7;
          margin-bottom:34px;
        }

        /* ERROR */

        .be-error{
          padding:14px 16px;
          border-radius:14px;
          background:#fff4f4;
          border:1px solid #fecaca;
          color:#dc2626;
          font-size:13px;
          margin-bottom:18px;
        }

        /* FORM */

        .be-field{
          margin-bottom:22px;
        }

        .be-label{
          display:block;
          margin-bottom:10px;
          font-size:14px;
          font-weight:700;
          color:#111827;
        }

        .be-wrap{
          position:relative;
        }

        .be-input{
          width:100%;
          height:58px;
          border-radius:18px;
          border:1.5px solid #e5e7eb;
          background:#fafafa;
          padding:0 18px;
          font-size:15px;
          color:#111827;
          outline:none;
          transition:0.25s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }

        .be-input:focus{
          border-color:#d4af37;
          background:#fff;
          box-shadow:0 0 0 5px rgba(212,175,55,0.12);
        }

        .be-input.err{
          border-color:#ef4444;
        }

        .be-input.pr{
          padding-right:50px;
        }

        .be-eye{
          position:absolute;
          top:50%;
          right:16px;
          transform:translateY(-50%);
          background:none;
          border:none;
          color:#9ca3af;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .be-field-err{
          margin-top:8px;
          font-size:12px;
          color:#ef4444;
        }

        /* BUTTON */

        .be-btn{
          width:100%;
          height:60px;
          border:none;
          border-radius:18px;
          margin-top:10px;
          background:linear-gradient(
            135deg,
            #f8e08e 0%,
            #d4af37 45%,
            #b8860b 100%
          );
          color:#000;
          font-size:17px;
          font-weight:800;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          transition:0.25s;
          font-family:'Plus Jakarta Sans',sans-serif;
          box-shadow:0 15px 35px rgba(212,175,55,0.28);
        }

        .be-btn:hover:not(:disabled){
          transform:translateY(-2px);
          box-shadow:0 20px 40px rgba(212,175,55,0.35);
        }

        .be-btn:disabled{
          opacity:0.7;
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
          margin-top:24px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          color:#9ca3af;
          font-size:13px;
        }

        .be-dot{
          width:9px;
          height:9px;
          border-radius:50%;
          background:#d4af37;
          box-shadow:0 0 14px rgba(212,175,55,0.8);
        }

        /* RESPONSIVE */

        @media(max-width:1000px){

          body{
            overflow:auto;
          }

          .be-login{
            height:auto;
            padding:12px;
          }

          .be-container{
            flex-direction:column;
            height:auto;
          }

          .be-left{
            padding:34px 24px;
            min-height:520px;
          }

          .be-right{
            width:100%;
            min-width:100%;
            padding:36px 24px;
          }

          .be-skyline{
            display:none;
          }

          .be-brand-name{
            font-size:42px;
          }

          .be-heading h1{
            font-size:52px;
          }

          .be-features{
            grid-template-columns:1fr;
          }

          .be-text{
            font-size:16px;
            line-height:1.8;
          }
        }

      `}</style>

      <div className="be-login">
        <div className="be-container">

          {/* LEFT SIDE */}

          <div className="be-left">

            <div className="be-skyline">
              <svg
                viewBox="0 0 750 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYEnd slice"
              >
                <line
                  x1="0"
                  y1="590"
                  x2="750"
                  y2="590"
                  stroke="#d4af37"
                  strokeWidth="2"
                  strokeOpacity="0.5"
                />

                {/* BURJ KHALIFA */}

                <g transform="translate(180, 20)">
                  <path
                    d="M50 550 V430 H110 V550"
                    stroke="#d4af37"
                    strokeWidth="2"
                    strokeOpacity="0.9"
                  />
                  <path
                    d="M58 430 V320 H102 V430"
                    stroke="#d4af37"
                    strokeWidth="2"
                    strokeOpacity="0.9"
                  />
                  <path
                    d="M66 320 V200 H94 V320"
                    stroke="#d4af37"
                    strokeWidth="2"
                    strokeOpacity="0.9"
                  />
                  <path
                    d="M74 200 V70 H86 V200"
                    stroke="#d4af37"
                    strokeWidth="2"
                    strokeOpacity="0.95"
                  />
                  <line
                    x1="80"
                    y1="70"
                    x2="80"
                    y2="0"
                    stroke="#f8e08e"
                    strokeWidth="2.5"
                  />

                  {[510,450,390,345,270,225].map((y)=>(
                    <line
                      key={y}
                      x1="52"
                      y1={y}
                      x2="108"
                      y2={y}
                      stroke="#d4af37"
                      strokeWidth="1"
                      strokeOpacity="0.4"
                    />
                  ))}
                </g>

                {/* BURJ AL ARAB */}

                <g transform="translate(470, 150)">
                  <path
                    d="M0 440 L90 140 C130 220, 140 335, 145 440"
                    stroke="#d4af37"
                    strokeWidth="2.5"
                    fill="rgba(212,175,55,0.03)"
                    strokeOpacity="0.9"
                  />

                  <path
                    d="M0 440 H145"
                    stroke="#d4af37"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                  />

                  <path
                    d="M90 140 V90"
                    stroke="#f8e08e"
                    strokeWidth="2.5"
                  />

                  <line
                    x1="42"
                    y1="290"
                    x2="124"
                    y2="290"
                    stroke="#d4af37"
                    strokeOpacity="0.4"
                  />

                  <line
                    x1="28"
                    y1="340"
                    x2="135"
                    y2="340"
                    stroke="#d4af37"
                    strokeOpacity="0.4"
                  />

                  <line
                    x1="14"
                    y1="390"
                    x2="142"
                    y2="390"
                    stroke="#d4af37"
                    strokeOpacity="0.4"
                  />
                </g>

                {/* RIGHT TOWER */}

                <path
                  d="M620 590 L650 310 L700 350 L680 590"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
              </svg>
            </div>

            <div className="be-brand">
              <div className="be-brand-logo">
                <img
                  src="/BullionLogo.jpeg"
                  alt="Bullion Electronics logo"
                />
              </div>

              <div>
                <div className="be-brand-name">
                  BULLION <br />
                  <span>ELECTRONICS</span>
                </div>

                <div className="be-brand-sub">
                  Enterprise Finance System
                </div>
              </div>
            </div>

            <div className="be-text">
              Secure financial management platform built for enterprise
              operations, reporting, branch monitoring and office workflow
              management across Abu Dhabi.
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

          {/* RIGHT SIDE */}

          <div className="be-right">
            <div className="be-card">

              <div className="be-heading">
                <h1>Welcome</h1>
                <p>Sign in securely to continue</p>
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
                      className={`be-input ${
                        errors.email ? 'err' : ''
                      }`}
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
                      className={`be-input pr ${
                        errors.password ? 'err' : ''
                      }`}
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
                      <ArrowRight size={18} />
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