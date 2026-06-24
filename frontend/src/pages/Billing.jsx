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
    }, 60);
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
      case 'Paid': return 'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-950/20';
      case 'PartiallyPaid': return 'border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-950/20';
      case 'Pending': return 'border border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 dark:bg-rose-950/20';
      default: return 'border border-slate-200 text-slate-550';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-850 dark:text-white tracking-tight">Invoices & Billing</h2>
          <p className="text-slate-450 dark:text-zinc-500 text-xs mt-0.5 font-bold">Manage client invoices, adjust consultation charges, and collect payments.</p>
        </div>
      </div>

      {/* Query Filter Toolbar */}
      <div className="handcrafted-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <div className="lg:col-span-2">
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-550 mb-2">Search patient</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBills()}
                className="w-full pl-8 pr-4 py-2.5 text-xs border border-slate-200 dark:border-zinc-800/60 rounded-lg bg-slate-50/50 dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#0f4c81] focus:ring-3 focus:ring-[#0f4c81]/5 transition-all font-semibold placeholder-slate-400 dark:placeholder-zinc-650"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-550 mb-2">Payment Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-zinc-800/60 rounded-lg bg-slate-50/50 dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#0f4c81] focus:ring-3 focus:ring-[#0f4c81]/5 transition-all font-bold"
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
              className="flex-1 bg-[#0f4c81] text-white font-bold py-2.5 px-4 rounded-lg text-xs hover:bg-[#155b96] active:scale-99 transition-all cursor-pointer shadow-sm"
            >
              Apply Filter
            </button>
            <button
              onClick={handleClearFilters}
              className="border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 font-bold py-2.5 px-4 rounded-lg text-xs transition-all cursor-pointer"
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
        <div className="handcrafted-card overflow-hidden">
          <div className="overflow-x-auto">
            {bills.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-zinc-800/60 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/40 dark:bg-zinc-900/10">
                    <th className="py-3 px-5">Invoice ID</th>
                    <th className="py-3 px-5">OPD Ref</th>
                    <th className="py-3 px-5">Patient details</th>
                    <th className="py-3 px-5">Invoice Total</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/30">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#0f4c81] dark:text-blue-400">INV-{String(bill.id).padStart(5, '0')}</td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-450">{bill.opdRegistration?.opd_number || 'N/A'}</td>
                      <td className="py-3.5 px-5">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200">{bill.patient?.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{bill.patient?.patient_id} | {bill.patient?.phone}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-800 dark:text-zinc-200">₹{bill.total_amount}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getPaidStatusBadge(bill.payment_status)}`}>
                          {bill.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-500">{new Date(bill.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleViewBill(bill.id)}
                          className="p-2 text-slate-450 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                          title="View Invoice"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-slate-400 font-semibold text-xs">No invoices matched the filters.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/40 bg-slate-50/20 dark:bg-zinc-900/10">
              <span className="text-[10px] font-bold text-slate-400">Page {page} of {totalPages} ({totalCount} total)</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/55 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/55 disabled:opacity-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#101117] border border-slate-200 dark:border-zinc-800/60 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-98 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800/50 flex justify-between items-center bg-slate-50/30 dark:bg-zinc-900/10">
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider">Invoice Statement</span>
              <button onClick={() => setDetailModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-850 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            {/* Printable Area */}
            <div className="p-6 bg-white print-container flex-1 overflow-y-auto text-slate-900">
              
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h3 className="text-lg font-black text-[#0f4c81] uppercase tracking-wide">HIMS HUB HOSPITAL</h3>
                <p className="text-[9px] font-bold text-slate-400">123 Health Ave, Suite 100 | Phone: (123) 456-7890</p>
                <h4 className="text-[10px] font-extrabold text-slate-700 mt-2.5 uppercase tracking-widest border border-dashed border-slate-300 py-0.5 inline-block px-3">
                  Billing Invoice receipt
                </h4>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px] text-slate-700 mb-5">
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider">Invoice ID</p>
                  <p className="font-bold text-slate-900">INV-{String(selectedBill.id).padStart(5, '0')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider">Dated</p>
                  <p className="font-bold text-slate-900">{new Date(selectedBill.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="border-t border-slate-100 pt-1 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider">Patient Name</p>
                  <p className="font-bold text-slate-900">{selectedBill.patient?.name} ({selectedBill.patient?.gender}, {selectedBill.patient?.age} Yrs)</p>
                </div>
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider">Patient ID</p>
                  <p className="font-mono text-slate-900 font-bold">{selectedBill.patient?.patient_id}</p>
                </div>

                <div className="border-t border-slate-100 pt-1 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider">Consulting Doctor</p>
                  <p className="font-bold text-slate-900">{selectedBill.opdRegistration?.doctor?.name || 'General Practitioner'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider">OPD Number</p>
                  <p className="font-mono text-slate-900 font-bold">{selectedBill.opdRegistration?.opd_number || 'N/A'}</p>
                </div>
              </div>

              {/* Line item Charges Table */}
              <div className="mt-4">
                <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider mb-2">Invoice Summary</p>
                <table className="w-full text-left text-[11px] border border-slate-200 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[8px] text-slate-500">
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2">Consultation Fee (OPD Visit)</td>
                      <td className="p-2 text-right">₹{selectedBill.consultation_fee}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Lab Diagnostics Charges</td>
                      <td className="p-2 text-right">₹{selectedBill.lab_charges}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Medicine Dispensation Charges</td>
                      <td className="p-2 text-right">₹{selectedBill.medicine_charges}</td>
                    </tr>
                    
                    {/* Calculations */}
                    <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                      <td className="p-2 text-right">Subtotal:</td>
                      <td className="p-2 text-right">
                        ₹{(parseFloat(selectedBill.consultation_fee) + parseFloat(selectedBill.lab_charges) + parseFloat(selectedBill.medicine_charges)).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="text-rose-600 font-bold">
                      <td className="p-2 text-right">Discount:</td>
                      <td className="p-2 text-right">-₹{selectedBill.discount}</td>
                    </tr>
                    <tr className="text-slate-600 font-semibold">
                      <td className="p-2 text-right">Tax (5%):</td>
                      <td className="p-2 text-right">₹{selectedBill.tax}</td>
                    </tr>
                    <tr className="bg-slate-100 text-slate-900 font-black text-xs border-t border-slate-350">
                      <td className="p-2 text-right uppercase tracking-wide">Total Amount:</td>
                      <td className="p-2 text-right">₹{selectedBill.total_amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payments History List */}
              <div className="mt-5 border-t border-slate-200 pt-3">
                <p className="text-slate-400 font-extrabold uppercase text-[7px] tracking-wider mb-2">Collected Payments</p>
                {selectedBill.payments && selectedBill.payments.length > 0 ? (
                  <div className="space-y-1.5 text-[11px]">
                    {selectedBill.payments.map((pay, pIdx) => (
                      <div key={pIdx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-600">
                        <span>
                          {new Date(pay.payment_date).toLocaleDateString()} | {pay.payment_mode} {pay.transaction_reference ? `(Ref: ${pay.transaction_reference})` : ''}
                        </span>
                        <span className="font-bold text-slate-900">+₹{pay.amount_paid}</span>
                      </div>
                    ))}
                    {/* Sum of payments */}
                    <div className="flex justify-between items-center p-2 text-xs font-black text-slate-800 pt-2.5">
                      <span>Total Paid:</span>
                      <span>
                        ₹{selectedBill.payments.reduce((acc, p) => acc + parseFloat(p.amount_paid), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 text-rose-600 text-center font-bold text-xs rounded-lg border border-rose-100">
                    No payment history recorded. Outstanding balance: ₹{selectedBill.total_amount}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 mt-6 pt-3 text-center text-[9px] text-slate-400 font-bold">
                <p>Thank you for choosing HIMS Hub. Maintain copy of invoice for insurance claims.</p>
                <p className="font-extrabold uppercase tracking-widest text-[6px] mt-1.5">Computerized Financial Invoice</p>
              </div>

            </div>

            {/* Modal actions */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/30 dark:bg-zinc-900/10 flex items-center justify-between">
              <div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-zinc-850 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  Print Invoice
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-850 text-slate-500 dark:text-zinc-400 font-bold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
                >
                  Cancel
                </button>
                {/* Adjust charges button (Staff only when Pending/PartiallyPaid) */}
                {isStaff && selectedBill.payment_status !== 'Paid' && (
                  <button
                    onClick={openAdjustForm}
                    className="px-4 py-2 border border-blue-200 dark:border-blue-800/40 text-[#0f4c81] dark:text-blue-400 font-bold rounded-lg text-xs hover:bg-blue-50/50 dark:hover:bg-blue-900/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Percent size={14} />
                    Adjust Fees
                  </button>
                )}
                {/* Collect payment button (Staff only when not fully paid) */}
                {isStaff && selectedBill.payment_status !== 'Paid' && (
                  <button
                    onClick={openPaymentForm}
                    className="px-4.5 py-2 bg-[#0f4c81] text-white font-bold rounded-lg text-xs hover:bg-[#155b96] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CreditCard size={14} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#101117] border border-slate-200 dark:border-zinc-800/60 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-98 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800/50 flex justify-between items-center bg-slate-50/30 dark:bg-zinc-900/10">
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm">Adjust Invoice Fees</span>
              <button onClick={() => setAdjustModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-850 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAdjustCharges} className="p-5 space-y-4">
              
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1.5">Lab Diagnostics Fees (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#0f4c81] focus:ring-3 focus:ring-[#0f4c81]/5 font-semibold"
                  value={labCharges}
                  onChange={(e) => setLabCharges(e.target.value)}
                  placeholder="e.g. 150.00"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1.5">Discount Concession (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#0f4c81] focus:ring-3 focus:ring-[#0f4c81]/5 font-semibold"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="e.g. 50.00"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100 dark:border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-zinc-850 text-slate-500 dark:text-zinc-400 font-bold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f4c81] text-white font-bold rounded-lg text-xs hover:bg-[#155b96] transition-all cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#101117] border border-slate-200 dark:border-zinc-800/60 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-98 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800/50 flex justify-between items-center bg-slate-50/30 dark:bg-zinc-900/10">
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm">Record Bill Payment</span>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-850 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCollectPayment} className="p-5 space-y-4">
              
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1.5">Amount to Pay (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#0f4c81] focus:ring-3 focus:ring-[#0f4c81]/5 font-black"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1.5">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#0f4c81] focus:ring-3 focus:ring-[#0f4c81]/5 font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="UPI">UPI / Digital Wallet</option>
                  <option value="NetBanking">NetBanking / Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1.5">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/40 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-[#0f4c81] focus:ring-3 focus:ring-[#0f4c81]/5 font-semibold"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="e.g. TXN98765432 or CASH-002"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100 dark:border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-zinc-850 text-slate-500 dark:text-zinc-400 font-bold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#0e9d6d] text-white font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
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
