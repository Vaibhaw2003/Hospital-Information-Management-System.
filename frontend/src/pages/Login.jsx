import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Show session expired notification if redirected
  React.useEffect(() => {
    if (searchParams.get('expired')) {
      toast.error('Session expired. Please log in again.');
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await login(data.usernameOrEmail, data.password);
    setSubmitting(false);

    if (result.success) {
      toast.success('Logged in successfully!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="w-full max-w-md">
        
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-2xl shadow-lg mb-3">
            <Stethoscope size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
            Welcome to HIMS Hub
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Please log in to access your dashboard
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Username/Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="admin or admin@hims.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all ${
                    errors.usernameOrEmail
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                  {...register('usernameOrEmail', { required: 'Username or email is required' })}
                />
              </div>
              {errors.usernameOrEmail && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.usernameOrEmail.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all focus:outline-hidden hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Helper for Testing */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-400">Demo Logins (Password: [role]123, e.g. admin123):</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-1 px-2 rounded-lg font-medium">admin</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-1 px-2 rounded-lg font-medium">doctor</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-1 px-2 rounded-lg font-medium">receptionist</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-1 px-2 rounded-lg font-medium">pharmacist</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
