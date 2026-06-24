import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, Activity, BadgeDollarSign,
  TrendingUp, Clock, ArrowRight, ShieldAlert,
  CalendarDays, Pill, Package, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';

/* ─── Skeleton ─── */
function Skel({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

/* ─── Custom Tooltip for chart ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-flat px-3.5 py-2.5 text-xs">
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-bold mt-0.5" style={{ color: 'var(--brand)' }}>
        ₹{Number(payload[0].value).toLocaleString('en-IN')}
      </p>
    </div>
  );
};

const PIE_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626'];

/* ─── KPI Card ─── */
function KpiCard({ title, value, desc, iconColor, icon: Icon, accent }) {
  return (
    <div className={`metric-card metric-card-${accent}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <p className="text-[28px] font-extrabold tracking-tight mt-1.5 leading-none" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
        </div>
        <div className={`icon-badge icon-badge-${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-[12px] font-medium mt-4 pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        {desc}
      </p>
    </div>
  );
}

/* ─── Dashboard ─── */
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentQueue, setRecentQueue] = useState([]);
  const [lowStockMeds, setLowStockMeds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, opdRes, invRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/opd?limit=5&status=Active'),
          api.get('/inventory?limit=5&filter=low-stock'),
        ]);
        setStats(statsRes.data.stats);
        setCharts(statsRes.data.charts);
        setRecentQueue(opdRes.data.opdRegistrations || []);
        setLowStockMeds(invRes.data.medicines || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skel className="h-7 w-48" />
            <Skel className="h-4 w-64" />
          </div>
          <Skel className="h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <Skel key={i} className="h-36 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skel className="lg:col-span-2 h-80 rounded-2xl" />
          <Skel className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients?.toLocaleString() || '0',
      desc: 'Registered patient profiles',
      iconColor: 'blue', accent: 'blue',
      icon: Users,
    },
    {
      title: 'Active Doctors',
      value: stats?.totalDoctors?.toLocaleString() || '0',
      desc: 'Consultants on duty',
      iconColor: 'green', accent: 'green',
      icon: Stethoscope,
    },
    {
      title: "Today's OPD",
      value: stats?.todayOpd?.toLocaleString() || '0',
      desc: 'Registrations today',
      iconColor: 'purple', accent: 'purple',
      icon: CalendarDays,
    },
    {
      title: 'Outstanding Dues',
      value: `₹${parseFloat(stats?.outstandingRevenue || 0).toLocaleString('en-IN')}`,
      desc: `${stats?.pendingPaymentsCount || 0} unpaid invoices`,
      iconColor: 'rose', accent: 'rose',
      icon: BadgeDollarSign,
    },
  ];

  const todayDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 fade-in">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.username} 👋
          </h2>
          <p className="page-subtitle">{todayDate} · Here's your hospital overview</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <Activity size={14} style={{ color: 'var(--brand)' }} />
          <span>Live Dashboard</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      {/* ── Revenue Summary Banner ── */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
          boxShadow: '0 8px 32px -4px rgba(37,99,235,0.35)'
        }}>
        <div>
          <p className="text-blue-200 text-[11px] font-bold uppercase tracking-widest">Total Revenue Collected</p>
          <p className="text-white text-4xl font-extrabold tracking-tight mt-1">
            ₹{parseFloat(stats?.totalRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-blue-200 text-[13px] mt-1">Across all paid invoices</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <p className="text-white text-2xl font-bold">{stats?.totalDoctors || 0}</p>
            <p className="text-blue-200 text-[11px] font-medium mt-0.5">Doctors</p>
          </div>
          <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <p className="text-white text-2xl font-bold">{stats?.totalPatients || 0}</p>
            <p className="text-blue-200 text-[11px] font-medium mt-0.5">Patients</p>
          </div>
          <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <p className="text-white text-2xl font-bold">{stats?.lowStockAlerts || 0}</p>
            <p className="text-blue-200 text-[11px] font-medium mt-0.5">Low Stock</p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => <KpiCard key={card.title} {...card} />)}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Area Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>Revenue Trend</h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Monthly collections (₹ INR)</p>
            </div>
            <span className="badge badge-blue">
              <TrendingUp size={11} className="mr-1" />
              Last 6 months
            </span>
          </div>
          <div className="h-64">
            {charts?.monthlyRevenue?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyRevenue}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="empty-state">
                  <div className="empty-state-icon"><TrendingUp size={24} /></div>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>No revenue data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>Department Visits</h3>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>OPD by speciality</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {charts?.departmentVisits?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={charts.departmentVisits} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value">
                    {charts.departmentVisits.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={24} /></div>
                <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>No OPD data</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {charts?.departmentVisits?.map((dept, i) => (
              <div key={dept.name} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {dept.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* OPD Queue */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="icon-badge icon-badge-purple" style={{ width: 36, height: 36, borderRadius: 10 }}>
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Active Queue</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Today's OPD registrations</p>
              </div>
            </div>
            {['Admin', 'Receptionist'].includes(user?.role) && (
              <Link to="/opd" className="flex items-center gap-1.5 text-[12px] font-semibold transition-opacity hover:opacity-75"
                style={{ color: 'var(--brand)' }}>
                View all <ArrowRight size={13} />
              </Link>
            )}
          </div>
          <div className="overflow-x-auto">
            {recentQueue.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQueue.map((opd) => (
                    <tr key={opd.id}>
                      <td>
                        <span className="badge badge-blue font-bold">#{opd.token_number}</span>
                      </td>
                      <td>
                        <p className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>{opd.patient?.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{opd.patient?.patient_id}</p>
                      </td>
                      <td className="font-medium text-[13px]" style={{ color: 'var(--text-secondary)' }}>{opd.doctor?.name}</td>
                      <td className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{opd.department?.name}</td>
                      <td className="text-right">
                        <span className={`badge ${opd.status === 'Active' ? 'badge-green' : opd.status === 'Completed' ? 'badge-slate' : 'badge-amber'}`}>
                          {opd.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><CheckCircle2 size={22} /></div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Queue is clear</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>No active registrations right now</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="icon-badge icon-badge-amber" style={{ width: 36, height: 36, borderRadius: 10 }}>
                <ShieldAlert size={16} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Inventory Alerts</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Low stock medicines</p>
              </div>
            </div>
            {stats?.lowStockAlerts > 0 && (
              <span className="badge badge-rose">{stats.lowStockAlerts} items</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {lowStockMeds.length > 0 ? (
              <div className="p-4 space-y-2.5">
                {lowStockMeds.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div>
                      <p className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>{med.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Exp: {med.expiry_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[13px]" style={{ color: '#dc2626' }}>{med.quantity}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>min {med.min_stock_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Pill size={22} /></div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>All stocked up</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>Inventory levels are healthy</p>
              </div>
            )}
          </div>
          {['Admin', 'Pharmacist'].includes(user?.role) && lowStockMeds.length > 0 && (
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <Link to="/inventory" className="btn btn-secondary w-full text-center text-[13px]">
                <Package size={14} />
                Manage Inventory
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
