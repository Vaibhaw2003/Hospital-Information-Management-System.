import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import { exportToCSV } from '../utils/exportCsv';
import { useForm } from 'react-hook-form';
import {
  Search,
  Plus,
  ArrowUpDown,
  History,
  FileDown,
  X,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Inventory = () => {
  const { user } = useAuth();
  const isPharmacist = user?.role === 'Pharmacist';
  const isAdmin = user?.role === 'Admin';
  const isStaff = isPharmacist || isAdmin;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Queries
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); // low-stock, expired
  const [page, setPage] = useState(1);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Adjust Form States
  const [adjustType, setAdjustType] = useState('IN');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory', {
        params: { page, limit: 10, search, filter }
      });
      setMedicines(res.data.medicines || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load inventory.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [page, filter]);

  const handleClearFilters = () => {
    setSearch('');
    setFilter('');
    setPage(1);
    setTimeout(() => {
      fetchMedicines();
    }, 50);
  };

  // Add new medicine product
  const onAddSubmit = async (data) => {
    try {
      const res = await api.post('/inventory', data);
      if (res.data.success) {
        toast.success('Medicine added to inventory successfully');
        setAddModalOpen(false);
        reset();
        fetchMedicines();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add medicine.');
    }
  };

  // Adjust stock (IN/OUT)
  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustQty || parseInt(adjustQty) <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }

    try {
      const res = await api.post(`/inventory/${selectedMedicine.id}/stock`, {
        transaction_type: adjustType,
        quantity: parseInt(adjustQty),
        notes: adjustNotes
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Stock adjusted successfully');
        setAdjustModalOpen(false);
        setAdjustQty('');
        setAdjustNotes('');
        fetchMedicines();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust stock.');
    }
  };

  // Open Adjust Form
  const openAdjustForm = (med) => {
    setSelectedMedicine(med);
    setAdjustType('IN');
    setAdjustModalOpen(true);
  };

  // View Stock History Logs
  const handleViewHistory = async (med) => {
    try {
      setSelectedMedicine(med);
      const res = await api.get(`/inventory/${med.id}/history`);
      setHistoryLogs(res.data.history || []);
      setHistoryModalOpen(true);
    } catch (error) {
      toast.error('Failed to load transaction history.');
    }
  };

  const handleExport = () => {
    const exportData = medicines.map(med => ({
      'Medicine Name': med.name,
      'Batch Number': med.batch_number,
      'Available Qty': med.quantity,
      'Min Alert Level': med.min_stock_level,
      'Expiry Date': med.expiry_date,
      'Purchase Price (INR)': med.purchase_price,
      'Selling Price (INR)': med.selling_price
    }));
    exportToCSV(exportData, `Medicine_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Inventory report exported!');
  };

  // Helper check for low stock
  const isLowStock = (med) => med.quantity <= med.min_stock_level;

  // Helper check for expired
  const isExpired = (med) => {
    const today = new Date().toISOString().split('T')[0];
    return med.expiry_date < today;
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Medicine Inventory</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium font-medium">Monitor pharmacy stock, record movements, and review expiry schedules.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
          >
            <FileDown size={16} />
            Export CSV
          </button>
          {isStaff && (
            <button
              onClick={() => {
                reset();
                setAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              Stock In Medicine
            </button>
          )}
        </div>
      </div>

      {/* Query Filters Form */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Search Catalog</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search medicine name, batch number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMedicines()}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Inventory Alert</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Stocks</option>
              <option value="low-stock">Low Stock Warnings</option>
              <option value="expired">Expired Batches</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchMedicines}
              className="flex-1 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Filter
            </button>
            <button
              onClick={handleClearFilters}
              className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold py-2.5 px-3 rounded-xl text-sm transition-colors cursor-pointer"
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {medicines.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-xs font-bold uppercase bg-slate-50/50 dark:bg-slate-900/10">
                    <th className="py-4 px-6">Medicine Product</th>
                    <th className="py-4 px-6">Batch Code</th>
                    <th className="py-4 px-6">Stock level</th>
                    <th className="py-4 px-6">Expiry Date</th>
                    <th className="py-4 px-6">Prices (Buy / Sell)</th>
                    <th className="py-4 px-6">Stock Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {medicines.map((med) => {
                    const low = isLowStock(med);
                    const exp = isExpired(med);
                    return (
                      <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <Pill size={20} />
                            </div>
                            <span className="font-bold text-slate-850 dark:text-slate-100">{med.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-550">{med.batch_number}</td>
                        <td className="py-4 px-6 font-bold">{med.quantity} units</td>
                        <td className="py-4 px-6 text-xs text-slate-650">
                          <span className={exp ? 'text-red-650 font-bold' : ''}>{med.expiry_date}</span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-350">
                          ₹{med.purchase_price} / <span className="font-bold text-slate-850 dark:text-slate-100">₹{med.selling_price}</span>
                        </td>
                        <td className="py-4 px-6">
                          {exp ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full">
                              <Flame size={10} /> Expired
                            </span>
                          ) : low ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                              <AlertTriangle size={10} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={10} /> Good Stock
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewHistory(med)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                              title="Audit Stock History"
                            >
                              <History size={16} />
                            </button>
                            {isStaff && (
                              <button
                                onClick={() => openAdjustForm(med)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                                title="Adjust / Restock"
                              >
                                <ArrowUpDown size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium">No medicine catalog matches.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400">Page {page} of {totalPages} (Total {totalCount} Medicines)</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD MEDICINE STOCK-IN MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <Pill className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Register Medicine Catalog</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onAddSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Medicine Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. Paracetamol 650mg"
                    {...register('name', { required: 'Medicine name is required' })}
                  />
                  {errors.name && <span className="text-[10px] text-red-500">{errors.name.message}</span>}
                </div>

                {/* Batch Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Batch Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white font-mono"
                    placeholder="e.g. PM-9908"
                    {...register('batch_number', { required: 'Batch number is required' })}
                  />
                  {errors.batch_number && <span className="text-[10px] text-red-500">{errors.batch_number.message}</span>}
                </div>

                {/* Initial Qty */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Initial Quantity</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 100"
                    {...register('quantity', { required: 'Initial stock quantity is required', min: { value: 0, message: 'Invalid quantity' } })}
                  />
                  {errors.quantity && <span className="text-[10px] text-red-500">{errors.quantity.message}</span>}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-650 mb-1.5 font-bold">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                    {...register('expiry_date', { required: 'Expiry date is required' })}
                  />
                  {errors.expiry_date && <span className="text-[10px] text-red-500">{errors.expiry_date.message}</span>}
                </div>

                {/* Min stock level */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Min Stock Alert Level</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 15"
                    {...register('min_stock_level', { required: 'Alert level is required' })}
                  />
                  {errors.min_stock_level && <span className="text-[10px] text-red-500">{errors.min_stock_level.message}</span>}
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Purchase Unit Cost (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 1.25"
                    {...register('purchase_price', { required: 'Purchase price is required' })}
                  />
                  {errors.purchase_price && <span className="text-[10px] text-red-500">{errors.purchase_price.message}</span>}
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Selling Unit Cost (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 3.00"
                    {...register('selling_price', { required: 'Selling price is required' })}
                  />
                  {errors.selling_price && <span className="text-[10px] text-red-500">{errors.selling_price.message}</span>}
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK IN/OUT MODAL */}
      {adjustModalOpen && selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <span className="font-bold text-slate-800 dark:text-white text-base">Adjust Stock: {selectedMedicine.name}</span>
              <button onClick={() => setAdjustModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAdjustStock} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-350 mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`py-2 px-4 rounded-xl font-bold border transition-all ${
                      adjustType === 'IN'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    STOCK IN (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`py-2 px-4 rounded-xl font-bold border transition-all ${
                      adjustType === 'OUT'
                        ? 'bg-red-650 text-white border-red-650 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    STOCK OUT (Adjustment)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-650 mb-1.5 font-bold">Quantity (Units)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-350 mb-1.5">Notes / Rationale</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Monthly replenishment batch or manual damage correction"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                >
                  Confirm Adjustment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* STOCK TRANSACTION AUDIT HISTORY MODAL */}
      {historyModalOpen && selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div>
                <span className="font-bold text-slate-800 dark:text-white text-base">Audit History: {selectedMedicine.name}</span>
                <p className="text-[10px] text-slate-400 font-bold">Batch Number: {selectedMedicine.batch_number}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {historyLogs.length > 0 ? (
                <div className="relative border-l border-slate-200 dark:border-slate-700 ml-4 pl-6 space-y-5">
                  {historyLogs.map((log) => {
                    const isStockIn = log.transaction_type === 'IN';
                    return (
                      <div key={log.id} className="relative text-xs">
                        {/* Bullet point indicator */}
                        <span className={`absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-800 ${
                          isStockIn ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`inline-block font-extrabold px-2 py-0.5 rounded-md text-[9px] mb-1.5 ${
                              isStockIn
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                            }`}>
                              STOCK {log.transaction_type}
                            </span>
                            <p className="text-slate-450 dark:text-slate-400 italic">"{log.notes || 'No description provided'}"</p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {isStockIn ? '+' : '-'}{log.quantity}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(log.transaction_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No transaction history found.</div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
