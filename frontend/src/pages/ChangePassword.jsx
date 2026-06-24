import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Key, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const newPasswordVal = watch('newPassword');

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await changePassword(data.oldPassword, data.newPassword);
    setSubmitting(false);

    if (result.success) {
      toast.success('Password updated successfully!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="glass-card p-8 rounded-3xl glow-blue max-w-md mx-auto animate-in fade-in zoom-in-95 duration-350">
      <div className="flex items-center gap-3.5 mb-8">
        <div className="bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/20 dark:border-blue-500/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
          <Key size={20} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Change Password</h2>
          <p className="text-[11px] font-semibold text-slate-450 mt-0.5">Secure your account with a new password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Current Password */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Current Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all duration-200 ${
              errors.oldPassword
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/10 focus:border-red-500'
                : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
            }`}
            {...register('oldPassword', { required: 'Current password is required' })}
          />
          {errors.oldPassword && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.oldPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all duration-200 ${
              errors.newPassword
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/10 focus:border-red-500'
                : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
            }`}
            {...register('newPassword', { 
              required: 'New password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters long' }
            })}
          />
          {errors.newPassword && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all duration-200 ${
              errors.confirmPassword
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/10 focus:border-red-500'
                : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
            }`}
            {...register('confirmPassword', { 
              required: 'Please confirm your new password',
              validate: (val) => val === newPasswordVal || 'Passwords do not match'
            })}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-bold py-3 px-4 rounded-xl text-center text-sm hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-101 active:scale-99 transition-all disabled:opacity-50 text-sm cursor-pointer"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ChangePassword;
