import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from '../components/Skeletons';
import {
  Users,
  Stethoscope,
  Calendar,
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentQueue, setRecentQueue] = useState([]);
  const [lowStockMeds, setLowStockMeds] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch dashboard statistics
        const response = await api.get('/dashboard/stats');
        setStats(response.data.stats);
        setCharts(response.data.charts);

        // 2. Fetch today's active OPD queue for quick view
        const opdResponse = await api.get('/opd?limit=5&status=Active');
        setRecentQueue(opdResponse.data.opdRegistrations || []);

        // 3. Fetch low stock medicines for quick view
        const invResponse = await api.get('/inventory?limit=5&filter=low-stock');
        setLowStockMeds(invResponse.data.medicines || []);

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Premium charts colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  // Define KPI cards configuration with rich premium colors and glowing shadows
  const kpiCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      desc: 'All registered patients',
      glowClass: 'glow-blue',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20 border border-blue-500/20'
    },
    {
      title: 'Active Doctors',
      value: stats?.totalDoctors || 0,
      icon: Stethoscope,
      desc: 'Consulting staff on duty',
      glowClass: 'glow-blue',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20 border border-indigo-500/20'
    },
    {
      title: "Today's OPD Queue",
      value: stats?.todayOpd || 0,
      icon: Activity,
      desc: 'Active consultations today',
      glowClass: 'glow-emerald',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20'
    },
    {
      title: 'Outstanding Dues',
      value: `₹${stats?.outstandingRevenue || '0.00'}`,
      icon: BadgeDollarSign,
      desc: `${stats?.pendingPaymentsCount || 0} bills pending payment`,
      glowClass: 'glow-red',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20 border border-rose-500/20'
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
          <p className="font-extrabold text-blue-600 dark:text-blue-400">
            Revenue: ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200">{payload[0].name}</p>
          <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {payload[0].value} Patients
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white tracking-tight">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Here is the quick health overview of the hospital today.
          </p>
        </div>
        <div className="text-xs bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-750 dark:text-blue-450 px-4 py-2.5 rounded-2xl font-bold border border-blue-500/20 dark:border-blue-500/10 shadow-xs">
          Last updated: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`glass-card p-6 rounded-2xl flex flex-col justify-between hover-lift ${card.glowClass}`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase tracking-widest">{card.title}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${card.iconBg}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-5 border-t border-slate-200/50 dark:border-slate-800/40 pt-3.5 font-medium">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between glow-blue">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight">Monthly Cash Flow</h4>
              <p className="text-[11px] text-slate-450 mt-0.5 font-medium">Total collected revenue (INR) over last 6 months</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-650 dark:text-emerald-450 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-xs">
              <TrendingUp size={14} />
              <span>Total: ₹{stats?.totalRevenue || 0}</span>
            </div>
          </div>
          <div className="h-72 w-full">
            {charts?.monthlyRevenue && charts.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/30" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} className="font-semibold" />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} className="font-semibold" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">No transaction records found to map.</div>
            )}
          </div>
        </div>

        {/* Department Visits Pie Chart */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between glow-blue">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight">Department Traffic</h4>
            <p className="text-[11px] text-slate-450 mt-0.5 font-medium">Outpatient distribution by medical department</p>
          </div>
          <div className="h-60 w-full relative flex items-center justify-center my-4">
            {charts?.departmentVisits && charts.departmentVisits.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.departmentVisits}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.departmentVisits.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs font-semibold">No active registrations mapped.</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-slate-200/50 dark:border-slate-800/40 pt-4">
            {charts?.departmentVisits?.map((dept, index) => (
              <div key={dept.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span>{dept.name} ({dept.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid for Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OPD Queue Summary (Left Column - Spans 2) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                <Clock size={16} />
              </span>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight">Active OPD Queue</h4>
            </div>
            {['Admin', 'Receptionist'].includes(user?.role) && (
              <Link to="/opd" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
                Manage Queue <ArrowRight size={14} className="mt-0.5" />
              </Link>
            )}
          </div>
          
          <div className="overflow-x-auto">
            {recentQueue.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Token</th>
                    <th className="pb-3 px-3">Patient</th>
                    <th className="pb-3 px-3">Assigned Doctor</th>
                    <th className="pb-3 px-3">Department</th>
                    <th className="pb-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {recentQueue.map((opd) => (
                    <tr key={opd.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 transition-colors group">
                      <td className="py-4 px-3 font-extrabold text-blue-600 dark:text-blue-400">#{opd.token_number}</td>
                      <td className="py-4 px-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{opd.patient?.name}</p>
                          <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{opd.patient?.patient_id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-3 font-semibold text-slate-700 dark:text-slate-300">{opd.doctor?.name}</td>
                      <td className="py-4 px-3 text-xs font-medium text-slate-500">{opd.department?.name}</td>
                      <td className="py-4 px-3 text-right">
                        <span className="inline-block text-[9px] bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {opd.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">No active patients in consultation queue.</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts (Right Column) */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                  <ShieldAlert size={16} />
                </span>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight">Stock Alerts</h4>
              </div>
              {stats?.lowStockAlerts > 0 && (
                <span className="text-[10px] bg-rose-500/10 text-rose-650 dark:bg-rose-500/20 dark:text-rose-350 border border-rose-500/20 font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                  {stats.lowStockAlerts} items
                </span>
              )}
            </div>

            <div className="space-y-3">
              {lowStockMeds.length > 0 ? (
                lowStockMeds.map((med) => (
                  <div key={med.id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 hover:scale-[1.01] transition-transform duration-200">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{med.name}</p>
                      <p className="text-[10px] font-semibold text-slate-450 mt-0.5">Batch: {med.batch_number} | Exp: {med.expiry_date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-rose-600 dark:text-rose-450">{med.quantity} left</span>
                      <p className="text-[10px] font-semibold text-slate-450 mt-0.5">Min: {med.min_stock_level}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">All medicines are fully stocked.</div>
              )}
            </div>
          </div>
          
          {['Admin', 'Pharmacist'].includes(user?.role) && lowStockMeds.length > 0 && (
            <Link
              to="/inventory"
              className="mt-6 flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-750 hover:opacity-95 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Reorder / Restock Inventory
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
