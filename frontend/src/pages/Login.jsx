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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080b11] px-4 transition-colors duration-200">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 glow-blue">
            <Stethoscope size={30} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gradient-primary">
            Welcome to HIMS Hub
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-semibold">
            Please log in to access your dashboard
          </p>
        </div>

        {/* Card Box */}
        <div className="glass-card p-8 rounded-3xl glow-blue">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Username/Email Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="admin or admin@hims.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all duration-200 ${
                    errors.usernameOrEmail
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/10 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
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
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all duration-200 ${
                    errors.password
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/10 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                  }`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
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
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-101 active:scale-99 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Helper for Testing */}
          <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/40 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demo Credentials</p>
            <p className="text-[10px] text-slate-450 mt-1">Password format: username + '123' (e.g. admin123)</p>
            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              <span className="text-[10px] bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/40 text-slate-600 dark:text-slate-450 py-1.5 px-2.5 rounded-xl font-bold">admin</span>
              <span className="text-[10px] bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/40 text-slate-600 dark:text-slate-450 py-1.5 px-2.5 rounded-xl font-bold">doctor</span>
              <span className="text-[10px] bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/40 text-slate-600 dark:text-slate-450 py-1.5 px-2.5 rounded-xl font-bold">receptionist</span>
              <span className="text-[10px] bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/40 text-slate-600 dark:text-slate-450 py-1.5 px-2.5 rounded-xl font-bold">pharmacist</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
