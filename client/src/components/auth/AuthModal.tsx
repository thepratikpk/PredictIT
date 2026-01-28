import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { login, register, isLoading } = useAuthStore();

  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (mode === 'register' && value.trim().length < 2) {
          error = 'Name must be at least 2 characters long';
        }
        break;
      case 'email':
        if (!value.includes('@') || !value.includes('.')) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (value.length < 6) {
          error = 'Password must be at least 6 characters long';
        }
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ name: '', email: '', password: '' });

    // Validate all fields
    const nameValid = mode === 'login' || validateField('name', formData.name);
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);

    if (!nameValid || !emailValid || !passwordValid) {
      return;
    }

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        toast.success('Welcome back! Successfully logged in.');
      } else {
        await register(formData.name, formData.email, formData.password);
        toast.success('Account created successfully! Welcome to PredictIT.');
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear general error when user types
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <Card className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>

            <CardHeader className="text-center">
              <CardTitle className="text-xl sm:text-2xl">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {mode === 'login' 
                  ? 'Sign in to save your ML projects' 
                  : 'Join us to save and manage your projects'
                }
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        onBlur={() => validateField('name', formData.name)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.name && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => validateField('email', formData.email)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onBlur={() => validateField('password', formData.password)}
                      className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                  {mode === 'register' && !fieldErrors.password && (
                    <p className="text-gray-500 text-xs mt-1">Must be at least 6 characters long</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                    </div>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError('');
                      setFieldErrors({ name: '', email: '', password: '' });
                      setFormData({ name: '', email: '', password: '' });
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>

              {mode === 'login' && (
                <div className="mt-4 text-center">
                  <button
                    onClick={onClose}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Continue as Guest
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};