import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Activity, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'var(--surface-2)' }}>
      <div className="w-full max-w-[380px] fade-in">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <Activity size={18} color="white" strokeWidth={2.5} />
          </div>
          <p className="font-bold text-[17px]" style={{ color: 'var(--text-primary)' }}>HIMS Hub</p>
        </div>

        <div className="card p-8">
          {successMsg ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: '#f0fdf4', color: '#059669' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <h2 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>Check your email</h2>
                <p className="text-[13px] mt-2" style={{ color: 'var(--text-secondary)' }}>{successMsg}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary w-full"
              >
                <ArrowLeft size={15} />
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-[24px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                  Forgot password?
                </h2>
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Enter your email address and we'll reset your credentials.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      placeholder="name@hims.com"
                      className="form-input"
                      style={{ paddingLeft: '38px', borderColor: errors.email ? '#dc2626' : undefined }}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[12px] font-medium mt-1.5" style={{ color: '#dc2626' }}>{errors.email.message}</p>
                  )}
                </div>

                <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Sending...
                    </span>
                  ) : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-ghost w-full text-[13px]"
                >
                  <ArrowLeft size={14} />
                  Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
