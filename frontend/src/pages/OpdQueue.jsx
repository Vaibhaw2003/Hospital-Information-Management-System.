import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import { useForm } from 'react-hook-form';
import {
  Search,
  Plus,
  Edit,
  Printer,
  X,
  ClipboardList,
  Stethoscope,
  ChevronRight,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const OpdQueue = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'Doctor';
  const isReceptionist = user?.role === 'Receptionist';
  const isAdmin = user?.role === 'Admin';
  const isStaff = isReceptionist || isAdmin;

  const [opdEntries, setOpdEntries] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter Query states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  
  const [selectedOpd, setSelectedOpd] = useState(null);
  const [selectedDocFee, setSelectedDocFee] = useState(0.00);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm();

  // Watch fields to dynamically update fields in forms
  const watchedDeptId = watch('department_id');
  const watchedDocId = watch('doctor_id');

  // Filter doctors based on department selection in the registration form
  useEffect(() => {
    if (watchedDeptId) {
      const filtered = doctors.filter((doc) => doc.department_id === parseInt(watchedDeptId) && doc.status === 'Active');
      setFilteredDoctors(filtered);
      setValue('doctor_id', ''); // Reset doctor selection
      setSelectedDocFee(0.00);
    } else {
      setFilteredDoctors([]);
    }
  }, [watchedDeptId, doctors, setValue]);

  // Update consultation fee dynamically when doctor is selected in the registration form
  useEffect(() => {
    if (watchedDocId) {
      const doc = doctors.find((d) => d.id === parseInt(watchedDocId));
      if (doc) {
        setSelectedDocFee(parseFloat(doc.consultation_fee));
        setValue('consultation_fee', doc.consultation_fee);
      }
    } else {
      setSelectedDocFee(0.00);
    }
  }, [watchedDocId, doctors, setValue]);

  const fetchOpdEntries = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        status,
        departmentId
      };

      // If Doctor is logged in, show only their queue
      if (isDoctor) {
        const docProfileRes = await api.get('/doctors');
        const selfDoc = docProfileRes.data.doctors?.find(d => d.user_id === user.id);
        if (selfDoc) {
          params.doctorId = selfDoc.id;
        }
      } else if (doctorId) {
        params.doctorId = doctorId;
      }

      const res = await api.get('/opd', { params });
      setOpdEntries(res.data.opdRegistrations || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load OPD queue.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const deptRes = await api.get('/doctors/departments');
      setDepartments(deptRes.data.departments || []);

      const docRes = await api.get('/doctors?limit=100&status=Active');
      setDoctors(docRes.data.doctors || []);

      const patRes = await api.get('/patients?limit=500');
      setPatients(patRes.data.patients || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOpdEntries();
  }, [page, status, departmentId, doctorId]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setDepartmentId('');
    setDoctorId('');
    setPage(1);
    setTimeout(() => {
      fetchOpdEntries();
    }, 50);
  };

  // Register new OPD entry
  const onRegisterSubmit = async (data) => {
    try {
      const res = await api.post('/opd', data);
      if (res.data.success) {
        toast.success(res.data.message || 'OPD Check-In completed successfully');
        setRegisterModalOpen(false);
        reset();
        fetchOpdEntries();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete OPD registration.');
    }
  };

  // Consult OPD (Update Diagnosis & Symptoms)
  const onConsultSubmit = async (data) => {
    try {
      const res = await api.put(`/opd/${selectedOpd.id}`, {
        ...data,
        status: data.status || 'Completed' // auto-complete if doctor updates diagnosis
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Consultation details recorded');
        setConsultModalOpen(false);
        fetchOpdEntries();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save consultation details.');
    }
  };

  const openConsultModal = (opd) => {
    setSelectedOpd(opd);
    setValue('chief_complaint', opd.chief_complaint);
    setValue('symptoms', opd.symptoms || '');
    setValue('diagnosis', opd.diagnosis || '');
    setValue('follow_up_required', opd.follow_up_required || false);
    setValue('next_visit_date', opd.next_visit_date || '');
    setValue('status', opd.status);
    setConsultModalOpen(true);
  };

  const openPrintModal = (opd) => {
    setSelectedOpd(opd);
    setPrintModalOpen(true);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">OPD Queue</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Track patient consultation queues and register clinical appointments.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => {
              reset();
              setRegisterModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            Register OPD Visit
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Search Patient */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Search Patient</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOpdEntries()}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Queue Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active (In Queue)</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={fetchOpdEntries}
              className="flex-1 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 font-semibold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold py-2 px-3 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {opdEntries.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-xs font-bold uppercase bg-slate-50/50 dark:bg-slate-900/10">
                    <th className="py-4 px-6">Token</th>
                    <th className="py-4 px-6">OPD ID</th>
                    <th className="py-4 px-6">Patient Details</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Consulting Doctor</th>
                    <th className="py-4 px-6">Chief Complaint</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {opdEntries.map((opd) => (
                    <tr key={opd.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-sm">
                          #{opd.token_number}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{opd.opd_number}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{opd.patient?.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{opd.patient?.patient_id} | {opd.patient?.gender}, {opd.patient?.age} yrs</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-slate-650">{opd.department?.name}</td>
                      <td className="py-4 px-6 font-medium">{opd.doctor?.name}</td>
                      <td className="py-4 px-6 text-xs text-slate-500 truncate max-w-xs">{opd.chief_complaint}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          opd.status === 'Active'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {opd.status === 'Active' ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                          {opd.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openPrintModal(opd)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                            title="Print OPD Slip"
                          >
                            <Printer size={16} />
                          </button>
                          {(isDoctor || isStaff) && (
                            <button
                              onClick={() => openConsultModal(opd)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                              title={isDoctor ? "Consult Patient" : "Edit OPD Record"}
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium">No patient visits queued.</div>
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

      {/* OPD REGISTRATION MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">New OPD Check-In</h3>
              </div>
              <button onClick={() => setRegisterModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onRegisterSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select Patient */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Select Patient</label>
                  <select
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('patient_id', { required: 'Please select a patient' })}
                  >
                    <option value="">Search Patient Registry...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.patient_id} - Phone: {p.phone})</option>
                    ))}
                  </select>
                  {errors.patient_id && <span className="text-[10px] text-red-500">{errors.patient_id.message}</span>}
                </div>

                {/* Select Department */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Department</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('department_id', { required: 'Please select department' })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.department_id && <span className="text-[10px] text-red-500">{errors.department_id.message}</span>}
                </div>

                {/* Select Doctor */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Consulting Doctor</label>
                  <select
                    disabled={!watchedDeptId}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white disabled:opacity-50"
                    {...register('doctor_id', { required: 'Please select a doctor' })}
                  >
                    <option value="">Select Doctor</option>
                    {filteredDoctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                    ))}
                  </select>
                  {errors.doctor_id && <span className="text-[10px] text-red-500">{errors.doctor_id.message}</span>}
                </div>

                {/* Visit Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Visit Type</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('visit_type')}
                  >
                    <option value="First Visit">First Visit</option>
                    <option value="Follow Up">Follow Up</option>
                  </select>
                </div>

                {/* Fee (Auto Field) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-650 mb-1.5 font-bold text-slate-650">Consultation Fee (INR)</label>
                  <input
                    type="number"
                    disabled
                    value={selectedDocFee}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold"
                  />
                  <input type="hidden" {...register('consultation_fee')} />
                </div>

                {/* Chief Complaint */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Chief Complaint</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                    placeholder="Describe main reason for patient visit..."
                    {...register('chief_complaint', { required: 'Chief complaint is required' })}
                  ></textarea>
                  {errors.chief_complaint && <span className="text-[10px] text-red-500">{errors.chief_complaint.message}</span>}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONSULTATION / EDIT OPD MODAL */}
      {consultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <Stethoscope className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Consultation: {selectedOpd?.patient?.name}</h3>
              </div>
              <button onClick={() => setConsultModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onConsultSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Chief Complaint (ReadOnly for Doctor) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Chief Complaint</label>
                  <textarea
                    rows={1.5}
                    disabled={isDoctor}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 focus:outline-hidden"
                    {...register('chief_complaint')}
                  ></textarea>
                </div>

                {/* Symptoms */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Observed Symptoms</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                    placeholder="Describe observed physical signs..."
                    {...register('symptoms')}
                  ></textarea>
                </div>

                {/* Diagnosis */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Diagnosis / Assessment</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                    placeholder="Enter clinical assessment, suspected disease..."
                    {...register('diagnosis')}
                  ></textarea>
                </div>

                {/* Follow Up Required Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="follow_up_required"
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500"
                    {...register('follow_up_required')}
                  />
                  <label htmlFor="follow_up_required" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 cursor-pointer">
                    Follow Up Required
                  </label>
                </div>

                {/* Next Visit Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-650 mb-1.5 font-bold">Next Visit Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                    {...register('next_visit_date')}
                  />
                </div>

                {/* OPD Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('status')}
                  >
                    <option value="Active">Active (In Queue)</option>
                    <option value="Completed">Completed / Discharged</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setConsultModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                >
                  {isDoctor ? 'Finish Consultation' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT SLIP VIEW MODAL */}
      {printModalOpen && selectedOpd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <span className="font-bold text-slate-850 dark:text-slate-100 text-sm">OPD Registration Slip Preview</span>
              <button onClick={() => setPrintModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            {/* Printable Slip Card */}
            <div className="p-8 bg-white dark:bg-slate-800 print-container flex-1 overflow-y-auto text-slate-900">
              
              {/* Slip Header */}
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wide">HIMS HUB HOSPITAL</h3>
                <p className="text-xs text-slate-400">123 Health Ave, Suite 100 | Phone: (123) 456-7890</p>
                <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 mt-2 uppercase tracking-widest border border-dashed border-slate-300 py-1 inline-block px-4">
                  Outpatient Registration Slip
                </h4>
              </div>

              {/* Slip details grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-700">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">OPD Number</p>
                  <p className="font-mono font-bold text-sm text-slate-900">{selectedOpd.opd_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Token Number</p>
                  <p className="text-lg font-extrabold text-blue-600">#{selectedOpd.token_number}</p>
                </div>

                <div className="border-t border-slate-100 pt-2 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Patient Name</p>
                  <p className="font-bold text-sm text-slate-900">{selectedOpd.patient?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Patient ID</p>
                  <p className="font-mono text-slate-900 font-semibold">{selectedOpd.patient?.patient_id}</p>
                </div>

                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Age / Gender</p>
                  <p className="font-semibold text-slate-900">{selectedOpd.patient?.age} Yrs / {selectedOpd.patient?.gender}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Mobile Phone</p>
                  <p className="font-semibold text-slate-900">{selectedOpd.patient?.phone}</p>
                </div>

                <div className="border-t border-slate-100 pt-2 col-span-2"></div>

                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Department</p>
                  <p className="font-bold text-slate-900">{selectedOpd.department?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Consulting Doctor</p>
                  <p className="font-bold text-slate-900">{selectedOpd.doctor?.name}</p>
                </div>

                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Registration Date</p>
                  <p className="font-semibold text-slate-900">{new Date(selectedOpd.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Consultation Fee</p>
                  <p className="font-bold text-slate-900">₹{selectedOpd.consultation_fee}</p>
                </div>

                <div className="border-t border-slate-100 pt-2 col-span-2"></div>

                <div className="col-span-2">
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Chief Complaint</p>
                  <p className="font-medium text-slate-900 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">{selectedOpd.chief_complaint}</p>
                </div>

                {selectedOpd.diagnosis && (
                  <div className="col-span-2">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Clinical Diagnosis</p>
                    <p className="font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">{selectedOpd.diagnosis}</p>
                  </div>
                )}
              </div>

              {/* Slip Footer */}
              <div className="border-t border-slate-200 mt-8 pt-4 text-center text-[10px] text-slate-400">
                <p>Thank you for choosing HIMS Hub. Please hold your token for queue call.</p>
                <p className="font-bold uppercase tracking-wider text-[8px] mt-1.5">Computer Generated Slip</p>
              </div>

            </div>

            {/* Print action buttons */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-end gap-3">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={triggerPrint}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors flex items-center gap-1.5"
              >
                <Printer size={16} />
                Print Slip
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OpdQueue;
