import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import {
  Search,
  Plus,
  Eye,
  Printer,
  X,
  FileText,
  Pill,
  Trash2,
  CheckCircle,
  Truck,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Prescriptions = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'Doctor';
  const isPharmacist = user?.role === 'Pharmacist';
  const isAdmin = user?.role === 'Admin';
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [opdVisits, setOpdVisits] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Queries
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Prescription creation form state
  const [opdId, setOpdId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { medicine_id: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', quantity: 10 }
  ]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/prescriptions', {
        params: { page, limit: 10, search, status }
      });
      setPrescriptions(res.data.prescriptions || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load prescriptions.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      // 1. Fetch active OPD registrations that might need prescription
      const opdRes = await api.get('/opd?limit=100');
      // Filter out visits that don't have a prescription yet (handled gracefully client-side or server-side)
      setOpdVisits(opdRes.data.opdRegistrations || []);

      // 2. Fetch medicines for Rx selection
      const medRes = await api.get('/inventory?limit=500');
      setMedicines(medRes.data.medicines || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [page, status]);

  useEffect(() => {
    if (addModalOpen) {
      fetchDropdowns();
    }
  }, [addModalOpen]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
    setTimeout(() => {
      fetchPrescriptions();
    }, 50);
  };

  // Add item row to prescription form
  const handleAddItemRow = () => {
    setItems([...items, { medicine_id: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', quantity: 10 }]);
  };

  // Remove item row
  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle item input change
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Submit new prescription
  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!opdId) {
      toast.error('Please select an OPD visit reference.');
      return;
    }

    const hasEmptyMedicine = items.some(item => !item.medicine_id);
    if (hasEmptyMedicine) {
      toast.error('Please select a medicine for all rows.');
      return;
    }

    const opd = opdVisits.find(v => v.id === parseInt(opdId));
    if (!opd) return;

    try {
      const payload = {
        opd_registration_id: parseInt(opdId),
        patient_id: opd.patient_id,
        notes,
        items: items.map(item => ({
          medicine_id: parseInt(item.medicine_id),
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: parseInt(item.quantity)
        }))
      };

      const res = await api.post('/prescriptions', payload);
      if (res.data.success) {
        toast.success('Prescription created successfully!');
        setAddModalOpen(false);
        // Reset form
        setOpdId('');
        setNotes('');
        setItems([{ medicine_id: '', dosage: '1 tablet', frequency: '1-0-1', duration: '5 days', quantity: 10 }]);
        fetchPrescriptions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit prescription.');
    }
  };

  // View prescription details
  const handleViewPrescription = async (id) => {
    try {
      const res = await api.get(`/prescriptions/${id}`);
      setSelectedPrescription(res.data.prescription);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load prescription details.');
    }
  };

  // Dispense medicines (Pharmacist action)
  const handleDispense = async (id) => {
    try {
      const res = await api.post(`/prescriptions/${id}/dispense`);
      if (res.data.success) {
        toast.success(res.data.message || 'Prescription dispensed successfully!');
        setDetailModalOpen(false);
        fetchPrescriptions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Dispensing failed. Check stock availability.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Prescriptions List</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium">Record patient drugs and process pharmacist dispensing pipelines.</p>
        </div>
        {(isDoctor || isAdmin) && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            Write Prescription
          </button>
        )}
      </div>

      {/* Filter box */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Search patient</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPrescriptions()}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Dispense Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Prescriptions</option>
              <option value="Pending">Pending (Not Dispensed)</option>
              <option value="Dispensed">Dispensed</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={fetchPrescriptions}
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
            {prescriptions.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-xs font-bold uppercase bg-slate-50/50 dark:bg-slate-900/10">
                    <th className="py-4 px-6">Rx ID</th>
                    <th className="py-4 px-6">OPD Number</th>
                    <th className="py-4 px-6">Patient Name</th>
                    <th className="py-4 px-6">Prescribing Doctor</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">Rx#{rx.id}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">{rx.opdRegistration?.opd_number}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-850 dark:text-slate-100">{rx.patient?.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{rx.patient?.patient_id} | {rx.patient?.phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium">{rx.doctor?.name}</td>
                      <td className="py-4 px-6 text-xs text-slate-650">{new Date(rx.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          rx.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {rx.status === 'Pending' ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                          {rx.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleViewPrescription(rx.id)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
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
              <div className="text-center py-12 text-slate-400 font-medium">No prescriptions found.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400">Page {page} of {totalPages} (Total {totalCount} Records)</span>
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

      {/* WRITE PRESCRIPTION MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Write Prescription</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePrescription} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Associated OPD Registration */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-650 mb-1.5 font-bold">OPD Visit Reference</label>
                  <select
                    value={opdId}
                    onChange={(e) => setOpdId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                  >
                    <option value="">Select Patient Visit...</option>
                    {opdVisits.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.patient?.name} ({v.opd_number} - Dr. {v.doctor?.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Medicines Array Form */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-350">Prescribed Medicines</p>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 items-end">
                      
                      {/* Medicine Selection */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Medicine Name</label>
                        <select
                          value={item.medicine_id}
                          onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        >
                          <option value="">Choose medicine...</option>
                          {medicines.map(med => (
                            <option key={med.id} value={med.id} disabled={med.quantity <= 0}>
                              {med.name} (Stock: {med.quantity} | Batch: {med.batch_number})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dosage */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Dosage</label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                          placeholder="e.g. 1 tab"
                        />
                      </div>

                      {/* Frequency */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Frequency</label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                          placeholder="e.g. 1-0-1"
                        />
                      </div>

                      {/* Duration */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Duration</label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                          placeholder="e.g. 5 days"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                      </div>

                      {/* Delete item row */}
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          disabled={items.length === 1}
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Consultation Notes / Instructions</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                  placeholder="Additional instructions for patient..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              {/* Submit buttons */}
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                >
                  Save Prescription
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRESCRIPTION DETAILS & DISPENSING PREVIEW MODAL */}
      {detailModalOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <span className="font-bold text-slate-800 dark:text-white text-sm">Prescription Overview</span>
              <button onClick={() => setDetailModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-8 bg-white print-container flex-1 overflow-y-auto text-slate-900">
              {/* Slip Header */}
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h3 className="text-lg font-bold text-blue-600 uppercase tracking-wide">HIMS HUB HOSPITAL</h3>
                <p className="text-[10px] text-slate-400">123 Health Ave, Suite 100 | Phone: (123) 456-7890</p>
                <h4 className="text-xs font-bold text-slate-600 mt-2 uppercase tracking-widest border border-dashed border-slate-300 py-0.5 inline-block px-3">
                  Medical Prescription Slip (Rx)
                </h4>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-700 mb-6">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Rx Number</p>
                  <p className="font-bold text-slate-900">Rx#{selectedPrescription.id}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Date</p>
                  <p className="font-bold text-slate-900">{new Date(selectedPrescription.date).toLocaleDateString()}</p>
                </div>

                <div className="border-t border-slate-100 pt-1.5 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Patient Name</p>
                  <p className="font-bold text-slate-900">{selectedPrescription.patient?.name} ({selectedPrescription.patient?.gender}, {selectedPrescription.patient?.age} Yrs)</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Patient ID</p>
                  <p className="font-mono text-slate-900 font-semibold">{selectedPrescription.patient?.patient_id}</p>
                </div>

                <div className="border-t border-slate-100 pt-1.5 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Prescribing Doctor</p>
                  <p className="font-bold text-slate-900">{selectedPrescription.doctor?.name}</p>
                  <p className="text-[9px] text-slate-450 font-bold">{selectedPrescription.doctor?.specialty} | Reg: {selectedPrescription.doctor?.registration_number}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">OPD Reference</p>
                  <p className="font-mono text-slate-900 font-bold">{selectedPrescription.opdRegistration?.opd_number}</p>
                </div>
              </div>

              {/* Medicines table */}
              <div className="mt-4">
                <p className="text-slate-400 font-bold uppercase text-[9px] mb-2">Prescribed Items</p>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[9px] text-slate-500">
                      <th className="p-2">Medicine</th>
                      <th className="p-2">Dosage</th>
                      <th className="p-2">Frequency</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedPrescription.items?.map((item, index) => (
                      <tr key={index} className="text-slate-800">
                        <td className="p-2 font-bold flex items-center gap-1">
                          <Pill size={12} className="text-blue-500" />
                          {item.medicine?.name}
                        </td>
                        <td className="p-2">{item.dosage}</td>
                        <td className="p-2 font-mono">{item.frequency}</td>
                        <td className="p-2">{item.duration}</td>
                        <td className="p-2 text-right font-bold">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Doctor's Instructions</p>
                  <p className="text-xs text-slate-700 italic mt-1 leading-relaxed">{selectedPrescription.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-200 mt-8 pt-4 text-center text-[10px] text-slate-400">
                <p>Verify drugs before ingestion. Keep away from children's reach.</p>
                <p className="font-bold uppercase tracking-wider text-[8px] mt-1">HIMS Hub Clinical Network</p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
              <div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-750 font-semibold rounded-xl text-sm hover:bg-slate-150 transition-colors flex items-center gap-1.5"
                >
                  <Printer size={16} />
                  Print Rx
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                {/* Dispense action (Pharmacist only when Pending) */}
                {(isPharmacist || isAdmin) && selectedPrescription.status === 'Pending' && (
                  <button
                    onClick={() => handleDispense(selectedPrescription.id)}
                    className="px-5 py-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Truck size={16} />
                    Dispense Drugs
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Prescriptions;
