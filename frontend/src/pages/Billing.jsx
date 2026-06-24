import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import {
  Search,
  Eye,
  Printer,
  X,
  CreditCard,
  Plus,
  Coins,
  ShieldCheck,
  Percent,
  FileBadge
} from 'lucide-react';
import toast from 'react-hot-toast';

const Billing = () => {
  const { user } = useAuth();
  const isReceptionist = user?.role === 'Receptionist';
  const isAdmin = user?.role === 'Admin';
  const isStaff = isReceptionist || isAdmin;

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Queries
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  const [selectedBill, setSelectedBill] = useState(null);

  // Form states
  const [labCharges, setLabCharges] = useState('');
  const [discount, setDiscount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [txRef, setTxRef] = useState('');

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/billing', {
        params: { page, limit: 10, search, paymentStatus: status }
      });
      setBills(res.data.billings || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load bills.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, status]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
    setTimeout(() => {
      fetchBills();
    }, 55);
  };

  // View invoice details
  const handleViewBill = async (id) => {
    try {
      const res = await api.get(`/billing/${id}`);
      setSelectedBill(res.data.billing);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load invoice details.');
    }
  };

  // Adjust lab charges and discount
  const handleAdjustCharges = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/billing/${selectedBill.id}`, {
        lab_charges: parseFloat(labCharges) || 0.00,
        discount: parseFloat(discount) || 0.00
      });
      if (res.data.success) {
        toast.success('Charges updated successfully!');
        setAdjustModalOpen(false);
        // Refresh details modal
        handleViewBill(selectedBill.id);
        fetchBills();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update invoice charges.');
    }
  };

  // Open adjust charges form
  const openAdjustForm = () => {
    setLabCharges(selectedBill.lab_charges);
    setDiscount(selectedBill.discount);
    setAdjustModalOpen(true);
  };

  // Record a payment transaction
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      toast.error('Please specify a valid payment amount.');
      return;
    }

    try {
      const res = await api.post(`/billing/${selectedBill.id}/payments`, {
        amount_paid: parseFloat(amountPaid),
        payment_mode: paymentMode,
        transaction_reference: txRef
      });
      if (res.data.success) {
        toast.success('Payment recorded successfully!');
        setPaymentModalOpen(false);
        setAmountPaid('');
        setTxRef('');
        // Refresh detail view
        handleViewBill(selectedBill.id);
        fetchBills();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment.');
    }
  };

  // Open payment collector modal
  const openPaymentForm = () => {
    const paidSum = selectedBill.payments?.reduce((acc, p) => acc + parseFloat(p.amount_paid), 0) || 0;
    const balance = parseFloat((parseFloat(selectedBill.total_amount) - paidSum).toFixed(2));
    setAmountPaid(balance);
    setPaymentModalOpen(true);
  };

  const getPaidStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-350 border border-emerald-500/20 glow-emerald';
      case 'PartiallyPaid': return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-350 border border-amber-500/20 glow-blue';
      case 'Pending': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-355 border border-rose-500/20 glow-red';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white tracking-tight">Billing & Invoices</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Record patient transactions, collect payments, and manage invoices.</p>
        </div>
      </div>

      {/* Query Filter */}
      <div className="glass-card p-6 rounded-2xl glow-blue">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
          
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-450 mb-2">Search Patient</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBills()}
                className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-850 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-450 mb-2">Payment Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="PartiallyPaid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchBills}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md hover:opacity-95 hover:scale-101 active:scale-99 transition-all cursor-pointer"
            >
              Filter
            </button>
            <button
              onClick={handleClearFilters}
              className="border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>

        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            {bills.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
                    <th className="py-4 px-6">Invoice ID</th>
                    <th className="py-4 px-6">OPD Reference</th>
                    <th className="py-4 px-6">Patient Name</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6">Payment Status</th>
                    <th className="py-4 px-6">Created Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 transition-all group">
                      <td className="py-4.5 px-6 font-extrabold text-blue-600 dark:text-blue-400">INV-{String(bill.id).padStart(5, '0')}</td>
                      <td className="py-4.5 px-6 font-mono text-xs font-semibold text-slate-450">{bill.opdRegistration?.opd_number || 'N/A'}</td>
                      <td className="py-4.5 px-6">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{bill.patient?.name}</p>
                          <p className="text-[10px] text-slate-450 font-bold mt-0.5">{bill.patient?.patient_id} | {bill.patient?.phone}</p>
                        </div>
                      </td>
                      <td className="py-4.5 px-6 font-extrabold text-slate-800 dark:text-slate-100">₹{bill.total_amount}</td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getPaidStatusBadge(bill.payment_status)}`}>
                          {bill.payment_status}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-xs font-semibold text-slate-500">{new Date(bill.createdAt).toLocaleDateString()}</td>
                      <td className="py-4.5 px-6 text-right">
                        <button
                          onClick={() => handleViewBill(bill.id)}
                          className="p-2.5 text-slate-450 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 rounded-xl transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 font-semibold text-sm">No invoice logs found.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4.5 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10">
              <span className="text-xs font-semibold text-slate-450">Page {page} of {totalPages} (Total {totalCount} Bills)</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BILL DETAILS MODAL */}
      {detailModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 no-print animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-200/60 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <span className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Invoice Preview</span>
              <button onClick={() => setDetailModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            {/* Printable Area */}
            <div className="p-8 bg-white print-container flex-1 overflow-y-auto text-slate-900">
              
              {/* Slip Header */}
              <div className="text-center border-b border-slate-200 pb-5 mb-5">
                <h3 className="text-xl font-black text-blue-600 uppercase tracking-wider">HIMS HUB HOSPITAL</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">123 Health Ave, Suite 100 | Phone: (123) 456-7890</p>
                <h4 className="text-xs font-extrabold text-slate-700 mt-3.5 uppercase tracking-widest border border-dashed border-slate-300 py-1 inline-block px-4">
                  Billing Invoice receipt
                </h4>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs text-slate-700 mb-6">
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Invoice Number</p>
                  <p className="font-bold text-slate-900 mt-0.5">INV-{String(selectedBill.id).padStart(5, '0')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Date</p>
                  <p className="font-bold text-slate-900 mt-0.5">{new Date(selectedBill.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="border-t border-slate-100 pt-1.5 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Patient Name</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedBill.patient?.name} ({selectedBill.patient?.gender}, {selectedBill.patient?.age} Yrs)</p>
                </div>
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Patient ID</p>
                  <p className="font-mono text-slate-900 font-bold mt-0.5">{selectedBill.patient?.patient_id}</p>
                </div>

                <div className="border-t border-slate-100 pt-1.5 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Consulting Doctor</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedBill.opdRegistration?.doctor?.name || 'General Practitioner'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">OPD Reference</p>
                  <p className="font-mono text-slate-900 font-bold mt-0.5">{selectedBill.opdRegistration?.opd_number || 'N/A'}</p>
                </div>
              </div>

              {/* Line item Charges Table */}
              <div className="mt-5">
                <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider mb-2.5">Billing Breakdowns</p>
                <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[9px] text-slate-500">
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr>
                      <td className="p-2.5">Consultation Fee (OPD Visit)</td>
                      <td className="p-2.5 text-right">₹{selectedBill.consultation_fee}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Lab Diagnostics Charges</td>
                      <td className="p-2.5 text-right">₹{selectedBill.lab_charges}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Medicine Dispensation Charges</td>
                      <td className="p-2.5 text-right">₹{selectedBill.medicine_charges}</td>
                    </tr>
                    
                    {/* Calculations */}
                    <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                      <td className="p-2.5 text-right">Subtotal:</td>
                      <td className="p-2.5 text-right">
                        ₹{(parseFloat(selectedBill.consultation_fee) + parseFloat(selectedBill.lab_charges) + parseFloat(selectedBill.medicine_charges)).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="text-rose-600 font-bold bg-rose-50/30">
                      <td className="p-2.5 text-right">Discount:</td>
                      <td className="p-2.5 text-right">-₹{selectedBill.discount}</td>
                    </tr>
                    <tr className="text-slate-600 font-semibold">
                      <td className="p-2.5 text-right">Tax (5%):</td>
                      <td className="p-2.5 text-right">₹{selectedBill.tax}</td>
                    </tr>
                    <tr className="bg-blue-50 text-blue-700 font-black text-sm border-t border-blue-200">
                      <td className="p-2.5 text-right uppercase tracking-wider">Total Amount:</td>
                      <td className="p-2.5 text-right">₹{selectedBill.total_amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payments History List */}
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider mb-2.5">Payment Transactions Log</p>
                {selectedBill.payments && selectedBill.payments.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {selectedBill.payments.map((pay, pIdx) => (
                      <div key={pIdx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-slate-700">
                        <span>
                          {new Date(pay.payment_date).toLocaleDateString()} | {pay.payment_mode} {pay.transaction_reference ? `(Ref: ${pay.transaction_reference})` : ''}
                        </span>
                        <span className="font-bold text-slate-900">+₹{pay.amount_paid}</span>
                      </div>
                    ))}
                    {/* Sum of payments */}
                    <div className="flex justify-between items-center p-2.5 text-xs font-black text-slate-800 border-t border-dashed border-slate-200 mt-2">
                      <span>Total Paid:</span>
                      <span>
                        ₹{selectedBill.payments.reduce((acc, p) => acc + parseFloat(p.amount_paid), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-rose-50 text-rose-600 text-center font-bold text-xs rounded-xl border border-rose-100">
                    No payment history recorded. Outstanding balance: ₹{selectedBill.total_amount}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 mt-8 pt-4 text-center text-[10px] text-slate-400 font-bold">
                <p>Thank you for choosing HIMS Hub. Maintain copy of invoice for insurance claims.</p>
                <p className="font-extrabold uppercase tracking-widest text-[7px] mt-1.5">Computerized Financial Invoice</p>
              </div>

            </div>

            {/* Modal actions */}
            <div className="px-6 py-4.5 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
              <div>
                <button
                  onClick={() => window.print()}
                  className="px-4.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={16} />
                  Print Invoice
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {/* Adjust charges button (Staff only when Pending/PartiallyPaid) */}
                {isStaff && selectedBill.payment_status !== 'Paid' && (
                  <button
                    onClick={openAdjustForm}
                    className="px-4.5 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-500/10 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-500/15 font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Percent size={16} />
                    Adjust Fees
                  </button>
                )}
                {/* Collect payment button (Staff only when not fully paid) */}
                {isStaff && selectedBill.payment_status !== 'Paid' && (
                  <button
                    onClick={openPaymentForm}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard size={16} />
                    Pay Bill
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADJUST FEES MODAL */}
      {adjustModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-200/60 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <span className="font-extrabold text-slate-850 dark:text-white text-base">Adjust Invoice Fees</span>
              <button onClick={() => setAdjustModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAdjustCharges} className="p-6 space-y-5">
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Lab Diagnostics Fees (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3.5 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold"
                  value={labCharges}
                  onChange={(e) => setLabCharges(e.target.value)}
                  placeholder="e.g. 150.00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Discount Concession (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3.5 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="e.g. 50.00"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-400 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Apply Recalculations
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {paymentModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-200/60 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <span className="font-extrabold text-slate-850 dark:text-white text-base">Record Bill Payment</span>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCollectPayment} className="p-6 space-y-5">
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Amount to Pay (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3.5 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-extrabold"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="UPI">UPI / Digital Wallet</option>
                  <option value="NetBanking">NetBanking / Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="e.g. TXN98765432 or CASH-002"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-400 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Record Payment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
