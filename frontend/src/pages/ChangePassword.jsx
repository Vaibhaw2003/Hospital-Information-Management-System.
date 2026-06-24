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
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
          <Key size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Change Password</h2>
          <p className="text-xs text-slate-400">Secure your account with a new password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Old Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            Current Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all ${
              errors.oldPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
            }`}
            {...register('oldPassword', { required: 'Current password is required' })}
          />
          {errors.oldPassword && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.oldPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all ${
              errors.newPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-800 dark:text-white focus:outline-hidden transition-all ${
              errors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
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
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-xl text-center text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ChangePassword;
