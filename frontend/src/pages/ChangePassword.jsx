import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const PasswordField = ({ label, name, placeholder, show, toggleShow, rules }) => (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className="form-input"
          style={{ paddingRight: '42px', borderColor: errors[name] ? '#dc2626' : undefined }}
          {...register(name, rules)}
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
          style={{ color: 'var(--text-muted)' }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {errors[name] && (
        <p className="text-[12px] font-medium mt-1.5" style={{ color: '#dc2626' }}>{errors[name].message}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto fade-in">
      <div className="card p-8">
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-8">
          <div className="icon-badge icon-badge-blue" style={{ width: 48, height: 48, borderRadius: 14 }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Change Password
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Secure your account with a new password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PasswordField
            label="Current Password"
            name="oldPassword"
            placeholder="••••••••"
            show={showOld}
            toggleShow={() => setShowOld(!showOld)}
            rules={{ required: 'Current password is required' }}
          />
          <PasswordField
            label="New Password"
            name="newPassword"
            placeholder="••••••••"
            show={showNew}
            toggleShow={() => setShowNew(!showNew)}
            rules={{ required: 'New password is required', minLength: { value: 6, message: 'Min 6 characters required' } }}
          />
          <PasswordField
            label="Confirm New Password"
            name="confirmPassword"
            placeholder="••••••••"
            show={showConfirm}
            toggleShow={() => setShowConfirm(!showConfirm)}
            rules={{ required: 'Please confirm your new password', validate: v => v === newPasswordVal || 'Passwords do not match' }}
          />

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => navigate('/')} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Updating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Key size={14} />
                  Update Password
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
