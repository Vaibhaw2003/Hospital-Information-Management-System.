import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import { exportToCSV } from '../utils/exportCsv';
import { useForm } from 'react-hook-form';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  X,
  Stethoscope,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Doctors = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Query states
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors', {
        params: {
          page,
          limit: 10,
          search,
          departmentId,
          status
        }
      });
      setDoctors(res.data.doctors || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to retrieve doctors list.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/doctors/departments');
      setDepartments(res.data.departments || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page, departmentId, status]); // fetch when filters change

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const handleClearFilters = () => {
    setSearch('');
    setDepartmentId('');
    setStatus('');
    setPage(1);
    // Trigger list fetch
    setTimeout(() => {
      fetchDoctors();
    }, 50);
  };

  // Add doctor handler
  const onAddSubmit = async (data) => {
    try {
      const res = await api.post('/doctors', data);
      if (res.data.success) {
        toast.success(res.data.message || 'Doctor added successfully');
        setAddModalOpen(false);
        reset();
        fetchDoctors();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add doctor profile.');
    }
  };

  // Edit doctor handler
  const onEditSubmit = async (data) => {
    try {
      const res = await api.put(`/doctors/${currentDoctor.id}`, data);
      if (res.data.success) {
        toast.success(res.data.message || 'Doctor updated successfully');
        setEditModalOpen(false);
        fetchDoctors();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update doctor profile.');
    }
  };

  // Open edit modal
  const openEditModal = (doc) => {
    setCurrentDoctor(doc);
    setValue('name', doc.name);
    setValue('department_id', doc.department_id);
    setValue('qualification', doc.qualification);
    setValue('specialty', doc.specialty);
    setValue('registration_number', doc.registration_number);
    setValue('consultation_fee', doc.consultation_fee);
    setValue('phone', doc.phone);
    setValue('email', doc.email);
    setValue('status', doc.status);
    setEditModalOpen(true);
  };

  // Deactivate doctor
  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this doctor profile? This will also disable their user login.')) {
      try {
        await api.delete(`/doctors/${id}`);
        toast.success('Doctor profile deactivated successfully.');
        fetchDoctors();
      } catch (error) {
        toast.error('Failed to deactivate doctor.');
      }
    }
  };

  // Export report
  const handleExport = () => {
    const exportData = doctors.map(doc => ({
      'Doctor ID': doc.id,
      'Name': doc.name,
      'Department': doc.department?.name,
      'Specialty': doc.specialty,
      'Qualification': doc.qualification,
      'Reg Number': doc.registration_number,
      'Consultation Fee': doc.consultation_fee,
      'Phone': doc.phone,
      'Email': doc.email,
      'Status': doc.status
    }));
    exportToCSV(exportData, `Doctors_Report_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Report exported successfully!');
  };

  return (
    <div className="space-y-6">
      
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Doctor Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage doctor profiles and user credentials.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
          >
            <FileDown size={16} />
            Export CSV
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                reset();
                setAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              Add Doctor
            </button>
          )}
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search bar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Search Doctor</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search name, specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Filters Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 font-semibold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold py-2 px-3 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {doctors.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-xs font-bold uppercase bg-slate-50/50 dark:bg-slate-900/10">
                    <th className="py-4 px-6">Doctor Info</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Reg Number</th>
                    <th className="py-4 px-6">Fee</th>
                    <th className="py-4 px-6">Contact</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Stethoscope size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{doc.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{doc.specialty}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{doc.department?.name}</p>
                          <p className="text-xs text-slate-400">{doc.qualification}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs">{doc.registration_number}</td>
                      <td className="py-4 px-6 font-semibold">₹{doc.consultation_fee}</td>
                      <td className="py-4 px-6">
                        <p className="text-xs">{doc.phone}</p>
                        <p className="text-xs text-slate-400">{doc.email}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {doc.status === 'Active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(doc)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                            title="Edit Doctor"
                          >
                            <Edit2 size={16} />
                          </button>
                          {isAdmin && doc.status === 'Active' && (
                            <button
                              onClick={() => handleDeactivate(doc.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                              title="Deactivate Doctor"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium">No doctor profiles found.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400">Page {page} of {totalPages} (Total {totalCount} Doctors)</span>
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

      {/* ADD DOCTOR MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <Stethoscope className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Add New Doctor Profile</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onAddSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Doctor Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Doctor Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. Dr. Jane Smith"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <span className="text-[10px] text-red-500">{errors.name.message}</span>}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Department</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('department_id', { required: 'Department is required' })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {errors.department_id && <span className="text-[10px] text-red-500">{errors.department_id.message}</span>}
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Qualification</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. MBBS, MD, FRCS"
                    {...register('qualification', { required: 'Qualification is required' })}
                  />
                  {errors.qualification && <span className="text-[10px] text-red-500">{errors.qualification.message}</span>}
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Specialty</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. Cardiologist"
                    {...register('specialty', { required: 'Specialty is required' })}
                  />
                  {errors.specialty && <span className="text-[10px] text-red-500">{errors.specialty.message}</span>}
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white font-mono"
                    placeholder="e.g. REG-12345"
                    {...register('registration_number', { required: 'Reg number is required' })}
                  />
                  {errors.registration_number && <span className="text-[10px] text-red-500">{errors.registration_number.message}</span>}
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Consultation Fee (INR)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 500"
                    {...register('consultation_fee', { required: 'Consultation fee is required' })}
                  />
                  {errors.consultation_fee && <span className="text-[10px] text-red-500">{errors.consultation_fee.message}</span>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 9876543210"
                    {...register('phone', { required: 'Phone is required' })}
                  />
                  {errors.phone && <span className="text-[10px] text-red-500">{errors.phone.message}</span>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. drsmith@hims.com"
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && <span className="text-[10px] text-red-500">{errors.email.message}</span>}
                </div>
              </div>

              {/* Login Info Block */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Configure User Login Account</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                      placeholder="e.g. janesmith (defaults to email prefix)"
                      {...register('username')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                      placeholder="Defaults to: doctor123"
                      {...register('password')}
                    />
                  </div>
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
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <Stethoscope className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Edit Doctor Profile</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onEditSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Doctor Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Doctor Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <span className="text-[10px] text-red-500">{errors.name.message}</span>}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Department</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('department_id', { required: 'Department is required' })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {errors.department_id && <span className="text-[10px] text-red-500">{errors.department_id.message}</span>}
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Qualification</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('qualification', { required: 'Qualification is required' })}
                  />
                  {errors.qualification && <span className="text-[10px] text-red-500">{errors.qualification.message}</span>}
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Specialty</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('specialty', { required: 'Specialty is required' })}
                  />
                  {errors.specialty && <span className="text-[10px] text-red-500">{errors.specialty.message}</span>}
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    disabled
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono"
                    {...register('registration_number')}
                  />
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Consultation Fee (INR)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('consultation_fee', { required: 'Consultation fee is required' })}
                  />
                  {errors.consultation_fee && <span className="text-[10px] text-red-500">{errors.consultation_fee.message}</span>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('phone', { required: 'Phone is required' })}
                  />
                  {errors.phone && <span className="text-[10px] text-red-500">{errors.phone.message}</span>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && <span className="text-[10px] text-red-500">{errors.email.message}</span>}
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('status', { required: 'Status is required' })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Doctors;
