import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Lock, User, Eye, EyeOff, ArrowRight, Stethoscope, Users, Pill, ClipboardList, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { role: 'Admin', user: 'admin', pass: 'admin123', code: 'APOLLO', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
  { role: 'Doctor', user: 'doctor', pass: 'doctor123', code: 'APOLLO', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { role: 'Receptionist', user: 'receptionist', pass: 'recep123', code: 'APOLLO', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  { role: 'Pharmacist', user: 'pharmacist', pass: 'pharma123', code: 'APOLLO', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
];

const FEATURES = [
  { icon: Stethoscope, label: 'Doctor Management', desc: 'Manage consultants & schedules' },
  { icon: Users,       label: 'Patient Registry',   desc: 'Complete patient records' },
  { icon: ClipboardList, label: 'OPD Workflow',    desc: 'Queue & registration system' },
  { icon: Pill,        label: 'Pharmacy & Billing', desc: 'Inventory & invoice management' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  React.useEffect(() => {
    if (searchParams.get('expired')) {
      toast.error('Session expired. Please log in again.');
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await login(data.hospitalCode, data.usernameOrEmail, data.password);
    setSubmitting(false);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.message || 'Invalid credentials');
    }
  };

  const fillDemo = (account) => {
    setValue('hospitalCode', account.code);
    setValue('usernameOrEmail', account.user);
    setValue('password', account.pass);
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0d1117' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}>

        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '360px', height: '360px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)'
          }} />
          <div style={{
            position: 'absolute', bottom: '80px', left: '-60px',
            width: '280px', height: '280px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)'
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: '1px', height: '70%',
            background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.04), transparent)'
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', boxShadow: '0 8px 24px rgba(37,99,235,0.40)' }}>
              <Activity size={20} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-bold text-[18px] tracking-tight leading-none">HIMS Hub</p>
              <p className="text-white/40 text-[11px] mt-0.5">Hospital Information Management</p>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-4xl font-bold leading-[1.2] tracking-tight">
              Streamline your<br />
              <span style={{
                background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                hospital workflow
              </span>
            </h2>
            <p className="text-white/50 text-[15px] mt-4 leading-relaxed">
              A unified platform for doctors, receptionists, pharmacists and administrators.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon size={16} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <p className="text-white/80 text-[13px] font-semibold">{label}</p>
                  <p className="text-white/35 text-[11px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-white/25 text-[11px]">
          © 2026 HIMS Hub — Hospital Management System
        </p>
      </div>

      {/* ── RIGHT PANEL (Login Form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: 'var(--surface-2)' }}>
        <div className="w-full max-w-[400px] space-y-6 fade-in">

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <Activity size={18} color="white" strokeWidth={2.5} />
            </div>
            <p className="font-bold text-[17px]" style={{ color: 'var(--text-primary)' }}>HIMS Hub</p>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-[28px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
              Sign in
            </h2>
            <p className="text-[14px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Hospital Code */}
            <div>
              <label className="form-label">Hospital Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Building2 size={16} />
                </span>
                <input
                  type="text"
                  placeholder="APOLLO"
                  className="form-input uppercase"
                  style={{ paddingLeft: '38px', borderColor: errors.hospitalCode ? '#dc2626' : undefined }}
                  {...register('hospitalCode', { required: 'Hospital code is required' })}
                />
              </div>
              {errors.hospitalCode && (
                <p className="text-[12px] font-medium mt-1.5" style={{ color: '#dc2626' }}>
                  {errors.hospitalCode.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="form-label">Username or Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="admin"
                  className="form-input"
                  style={{ paddingLeft: '38px', borderColor: errors.usernameOrEmail ? '#dc2626' : undefined }}
                  {...register('usernameOrEmail', { required: 'Username or email is required' })}
                />
              </div>
              {errors.usernameOrEmail && (
                <p className="text-[12px] font-medium mt-1.5" style={{ color: '#dc2626' }}>
                  {errors.usernameOrEmail.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[12px] font-semibold transition-opacity hover:opacity-80"
                  style={{ color: 'var(--brand)' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '42px', borderColor: errors.password ? '#dc2626' : undefined }}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] font-medium mt-1.5" style={{ color: '#dc2626' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full text-[15px] py-3"
              style={{ borderRadius: '12px' }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Demo Accounts</p>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-90 active:scale-95"
                  style={{ background: acc.bg, border: `1px solid ${acc.color}20` }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: acc.color }}></span>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: acc.color }}>{acc.role}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{acc.user}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
              Click a role to auto-fill credentials, then sign in
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
