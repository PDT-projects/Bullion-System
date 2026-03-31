import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../api/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

// ✅ Add your allowed emails here — must match exactly what's in Firebase Console
const ALLOWED_EMAILS = [
  'fatimamalikk72@gmail.com',
  //add emails here
];

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

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

      // ✅ Whitelist check — sign out immediately if email not allowed
      if (!ALLOWED_EMAILS.includes(user.email ?? '')) {
        await signOut(auth);
        toast.error('Access denied. You are not authorized to use this system.');
        setIsLoading(false);
        return;
      }

      toast.success('Login successful!');
      onLoginSuccess(user);
      navigate('/dashboard');

    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f2f5] via-[#e8ecf1] to-[#f8fafc] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <img src="/PDT-logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pakistan Detectors Technologies</h1>
          <p className="text-gray-600">Cash Flow Management System</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#4f46e5] mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`h-12 border-2 ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-lg`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`h-12 border-2 ${errors.password ? 'border-red-400' : 'border-gray-200'} rounded-lg`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-semibold rounded-lg shadow-lg hover:scale-[1.02] transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>© 2024 Pakistan Detectors Technologies. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}