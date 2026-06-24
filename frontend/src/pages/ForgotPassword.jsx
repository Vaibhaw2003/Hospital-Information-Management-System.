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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-2xl shadow-lg mb-3">
            <Stethoscope size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
            Reset Password
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            Enter your email to restore your credentials
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
          {successMsg ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium">
                {successMsg}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="name@hims.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all ${
                      errors.email
                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
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
                className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all focus:outline-hidden hover:-translate-y-0.5"
              >
                {submitting ? 'Verifying...' : 'Recover Credentials'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline"
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
