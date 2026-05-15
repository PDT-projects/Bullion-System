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

        /* LEFT PANEL */

        .be-left{
          flex:1;
          position:relative;
          padding:42px 50px;
          display:flex;
          flex-direction:column;
          justify-content:flex-start;
          overflow:hidden;
        }

        /* SKYLINE STYLE CONFIGURATION */

        .be-skyline{
          position:absolute;
          left:0;
          right:0;
          bottom:0;
          height:100%;
          pointer-events:none;
          opacity:0.42;
          display:flex;
          align-items:flex-end;
          justify-content:flex-start;
          z-index:1;
        }

        .be-skyline svg {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* BRAND */

        .be-brand{
          position:relative;
          z-index:2;
          display:flex;
          align-items:center;
          gap:14px;
          margin-bottom:28px;
          margin-top: 20px;
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
          background:rgba(7, 20, 35, 0.6);
          border:1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(8px);
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

        /* RIGHT PANEL */

        .be-right{
          width:460px;
          min-width:460px;
          background:#ffffff;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:38px;
          position:relative;
          z-index:2;
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

        /* RESPONSIVE SCALING */

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
            min-height: 480px;
          }

          .be-skyline{
            display:none;
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
          
          {/* LEFT PANEL WITH INTEGRATED SKYSCRAPER VECTORS */}
          <div className="be-left">
            
            <div className="be-skyline">
              <svg viewBox="0 0 750 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYEnd slice">
                {/* Baseline Grid Horizon */}
                <line x1="0" y1="590" x2="750" y2="590" stroke="#34d399" strokeWidth="2.5" strokeOpacity="0.5" />
                
                {/* Left Background Minarets */}
                <path d="M20 590 V460 H40 V590" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M30 460 V390" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M25 390 C25 375, 35 375, 35 390 Z" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
                
                <path d="M55 590 V490 H105 V590" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M55 490 C55 450, 105 450, 105 490 Z" fill="rgba(16,185,129,0.05)" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />

                {/* Subground Abstract Structural Columns */}
                <path d="M120 590 V360 H165 V590" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
                <circle cx="142" cy="340" r="12" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
                <line x1="142" y1="328" x2="142" y2="300" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />

                {/* PROMINENT BURJ KHALIFA STRUCTURE */}
                <g id="burj-khalifa" transform="translate(190, 40)">
                  {/* Foundation Core Podiums */}
                  <path d="M50 550 V430 H110 V550" stroke="#34d399" strokeWidth="2" strokeOpacity="0.85" fill="rgba(4, 17, 31, 0.85)" />
                  <path d="M35 550 V470 H125 V550" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
                  
                  {/* Tier Segment 2 */}
                  <path d="M58 430 V320 H102 V430" stroke="#34d399" strokeWidth="2" strokeOpacity="0.85" fill="rgba(4, 17, 31, 0.85)" />
                  <path d="M48 430 V360 H112 V430" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
                  
                  {/* Tier Segment 3 */}
                  <path d="M66 320 V200 H94 V320" stroke="#34d399" strokeWidth="2" strokeOpacity="0.9" fill="rgba(4, 17, 31, 0.85)" />
                  <path d="M58 320 V240 H102 V320" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.4" />

                  {/* Upper Spire Spindle & Needle */}
                  <path d="M74 200 V70 H86 V200" stroke="#34d399" strokeWidth="2" strokeOpacity="0.95" fill="rgba(4, 17, 31, 0.9)" />
                  <line x1="80" y1="70" x2="80" y2="0" stroke="#34d399" strokeWidth="2.5" strokeOpacity="1" />
                  <line x1="80" y1="550" x2="80" y2="70" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" />

                  {/* Detailed Mechanical Louvers / Horizontal Architectural Facades */}
                  <line x1="53" y1="510" x2="107" y2="510" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.4" />
                  <line x1="53" y1="450" x2="107" y2="450" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.4" />
                  <line x1="61" y1="390" x2="99" y2="390" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
                  <line x1="61" y1="345" x2="99" y2="345" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
                  <line x1="68" y1="270" x2="92" y2="270" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
                  <line x1="68" y1="225" x2="92" y2="225" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
                  <line x1="75" y1="150" x2="85" y2="150" stroke="#34d399" strokeWidth="1" strokeOpacity="0.6" />
                  <line x1="75" y1="110" x2="85" y2="110" stroke="#34d399" strokeWidth="1" strokeOpacity="0.6" />
                </g>

                {/* HIGH-CONTRAST MEDIUM DENSITY ARCH DESIGN */}
                <path d="M375 590 V390 C375 330, 425 330, 425 390 V590" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" fill="rgba(4, 17, 31, 0.4)" />
                <path d="M390 390 V590 M410 390 V590" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.3" />

                {/* ENHANCED LARGE BURJ AL ARAB VECTOR */}
                <g id="burj-al-arab" transform="translate(450, 150)">
                  {/* Distinct Outward Triangular Bow Outline */}
                  <path d="M0 440 L90 140 C130 220, 140 335, 145 440" stroke="#34d399" strokeWidth="2.5" fill="rgba(16,185,129,0.06)" strokeOpacity="0.9" />
                  <path d="M0 440 H145" stroke="#34d399" strokeWidth="2" strokeOpacity="0.8" />
                  
                  {/* Outer Exoskeleton Mast Truss */}
                  <path d="M90 140 V90 L75 96" stroke="#34d399" strokeWidth="2.5" strokeOpacity="0.9" />
                  <path d="M72 140 C115 140, 160 170, 168 215" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.6" />
                  
                  {/* Horizontal Rib Struts */}
                  <line x1="42" y1="290" x2="124" y2="290" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
                  <line x1="53" y1="250" x2="116" y2="250" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
                  <line x1="66" y1="210" x2="108" y2="210" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.5" />
                  <line x1="28" y1="340" x2="135" y2="340" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
                  <line x1="14" y1="390" x2="142" y2="390" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5" />
                  
                  {/* Helipad Cantilever Projection */}
                  <line x1="68" y1="180" x2="110" y2="180" stroke="#34d399" strokeWidth="2" strokeOpacity="0.9" />
                </g>

                {/* Right Edge Modern Tapered Towers */}
                <path d="M620 590 L650 310 L700 350 L680 590" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" fill="rgba(4, 17, 31, 0.4)" />
                <line x1="642" y1="380" x2="688" y2="400" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="636" y1="430" x2="682" y2="450" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="630" y1="480" x2="676" y2="500" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />

                {/* Ground Accents (Palm Frond Vector Layouts) */}
                <path d="M175 572 C172 560, 162 555, 156 560 M175 572 C181 560, 191 555, 197 560 M175 590 V572" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.7" />
                <path d="M435 578 C432 568, 424 564, 419 568 M435 578 C441 568, 449 564, 454 568 M435 590 V578" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.7" />
              </svg>
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

          {/* RIGHT PANEL FOR COMPACT FORM INTERACTION */}
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
                  <label className="be-label">Email Address</label>
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
                  <label className="be-label">Password</label>
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
                      onClick={() => setShowPassword((p) => !p)}
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
                      <Loader2 size={18} className="be-spin" />
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