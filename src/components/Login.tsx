import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface LoginProps {
  onNavigateToSignup: () => void;
  onLoginSuccess: (user: any) => void;
}

export function Login({ onNavigateToSignup, onLoginSuccess }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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
      toast.success('Login successful!');
      onLoginSuccess(userCredential.user);
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
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
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f2f5] via-[#e8ecf1] to-[#f8fafc] p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <img
              src="/PDT-logo.png"
              alt="Pakistan Detectors Technologies"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pakistan Detectors Technologies</h1>
          <p className="text-gray-600">Cash Flow Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#4f46e5] mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`h-12 text-base border-2 transition-all duration-200 ${
                    errors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  } rounded-lg`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-red-500">⚠</span> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`h-12 text-base border-2 transition-all duration-200 ${
                    errors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  } rounded-lg`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-red-500">⚠</span> {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:from-[#4338ca] hover:to-[#6d28d9] text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={onNavigateToSignup}
                  className="text-[#4f46e5] hover:text-[#7c3aed] font-semibold hover:underline transition-colors duration-200"
                  disabled={isLoading}
                >
                  Sign up here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Pakistan Detectors Technologies. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
