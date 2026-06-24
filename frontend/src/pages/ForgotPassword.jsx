import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await forgotPassword(data.email);
    setSubmitting(false);

    if (result.success) {
      toast.success('Reset instruction triggered!');
      setSuccessMsg(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080b11] px-4 transition-colors duration-200">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 mb-4 glow-blue">
            <Stethoscope size={30} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gradient-primary">
            Reset Password
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-semibold">
            Enter your email to restore your credentials
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl glow-blue">
          {successMsg ? (
            <div className="text-center space-y-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl text-sm font-semibold">
                {successMsg}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="name@hims.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all duration-200 ${
                      errors.email
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/10 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                    }`}
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-101 active:scale-99 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {submitting ? 'Verifying...' : 'Recover Credentials'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
