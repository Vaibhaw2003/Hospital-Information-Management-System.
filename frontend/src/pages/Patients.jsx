import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeletons';
import { exportToCSV } from '../utils/exportCsv';
import { useForm } from 'react-hook-form';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  X,
  Users,
  Contact2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Patients = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Query states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients', {
        params: {
          page,
          limit: 10,
          search
        }
      });
      setPatients(res.data.patients || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to retrieve patients list.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page]); // fetch when page changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleClearFilters = () => {
    setSearch('');
    setPage(1);
    setTimeout(() => {
      fetchPatients();
    }, 50);
  };

  // Add patient handler
  const onAddSubmit = async (data) => {
    try {
      const res = await api.post('/patients', data);
      if (res.data.success) {
        toast.success(res.data.message || 'Patient registered successfully');
        setAddModalOpen(false);
        reset();
        fetchPatients();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add patient.');
    }
  };

  // Edit patient handler
  const onEditSubmit = async (data) => {
    try {
      const res = await api.put(`/patients/${currentPatient.id}`, data);
      if (res.data.success) {
        toast.success(res.data.message || 'Patient details updated successfully');
        setEditModalOpen(false);
        fetchPatients();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update patient.');
    }
  };

  // Open edit modal
  const openEditModal = (pat) => {
    setCurrentPatient(pat);
    setValue('name', pat.name);
    setValue('age', pat.age);
    setValue('gender', pat.gender);
    setValue('phone', pat.phone);
    setValue('address', pat.address);
    setValue('blood_group', pat.blood_group);
    setValue('emergency_contact', pat.emergency_contact);
    setEditModalOpen(true);
  };

  // Delete patient
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient profile permanently? This cannot be undone.')) {
      try {
        await api.delete(`/patients/${id}`);
        toast.success('Patient deleted successfully.');
        fetchPatients();
      } catch (error) {
        toast.error('Failed to delete patient. Ensure there are no active consultation history logs linked.');
      }
    }
  };

  // Export report
  const handleExport = () => {
    const exportData = patients.map(pat => ({
      'Patient ID': pat.patient_id,
      'Name': pat.name,
      'Age': pat.age,
      'Gender': pat.gender,
      'Phone': pat.phone,
      'Address': pat.address,
      'Blood Group': pat.blood_group,
      'Emergency Contact': pat.emergency_contact,
      'Registered Date': new Date(pat.createdAt).toLocaleDateString()
    }));
    exportToCSV(exportData, `Patients_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Registry exported successfully!');
  };

  return (
    <div className="space-y-6">
      
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage patient health records and registration archives.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
          >
            <FileDown size={16} />
            Export CSV
          </button>
          {['Admin', 'Receptionist'].includes(user?.role) && (
            <button
              onClick={() => {
                reset();
                setAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              Register Patient
            </button>
          )}
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          {/* Search bar */}
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Search Registry</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search patient by Name, ID, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
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
            {patients.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 text-xs font-bold uppercase bg-slate-50/50 dark:bg-slate-900/10">
                    <th className="py-4 px-6">Patient Info</th>
                    <th className="py-4 px-6">ID Code</th>
                    <th className="py-4 px-6">Demographics</th>
                    <th className="py-4 px-6">Blood Group</th>
                    <th className="py-4 px-6">Address</th>
                    <th className="py-4 px-6">Emergency Contact</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {patients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-200">{pat.name}</td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{pat.patient_id}</td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-350">
                        <span className="font-semibold">{pat.gender}</span>, {pat.age} yrs
                      </td>
                      <td className="py-4 px-6 font-semibold">{pat.blood_group || 'Not specified'}</td>
                      <td className="py-4 px-6 text-xs truncate max-w-xs">{pat.address}</td>
                      <td className="py-4 px-6">
                        <p className="text-xs font-medium">{pat.phone}</p>
                        {pat.emergency_contact && (
                          <p className="text-[10px] text-slate-400 font-semibold">{pat.emergency_contact}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {['Admin', 'Receptionist'].includes(user?.role) && (
                            <button
                              onClick={() => openEditModal(pat)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                              title="Edit Details"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(pat.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                              title="Delete Patient"
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
              <div className="text-center py-12 text-slate-400 font-medium">No patient records found.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400">Page {page} of {totalPages} (Total {totalCount} Patients)</span>
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

      {/* REGISTER PATIENT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <Users className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Register Patient Profile</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onAddSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. Alice Smith"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <span className="text-[10px] text-red-500">{errors.name.message}</span>}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Age (Years)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 28"
                    {...register('age', { required: 'Age is required', min: { value: 0, message: 'Invalid age' } })}
                  />
                  {errors.age && <span className="text-[10px] text-red-500">{errors.age.message}</span>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Gender</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('gender', { required: 'Gender is required' })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <span className="text-[10px] text-red-500">{errors.gender.message}</span>}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. 9876543210"
                    {...register('phone', { required: 'Mobile is required' })}
                  />
                  {errors.phone && <span className="text-[10px] text-red-500">{errors.phone.message}</span>}
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Blood Group</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('blood_group')}
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Residential Address</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                    placeholder="Residential address details..."
                    {...register('address', { required: 'Address is required' })}
                  ></textarea>
                  {errors.address && <span className="text-[10px] text-red-500">{errors.address.message}</span>}
                </div>

                {/* Emergency Contact */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Emergency Contact Person</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    placeholder="e.g. John Doe (Father) - 9876543211"
                    {...register('emergency_contact')}
                  />
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
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PATIENT DETAILS MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <Contact2 className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Edit Patient Details</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onEditSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <span className="text-[10px] text-red-500">{errors.name.message}</span>}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Age (Years)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('age', { required: 'Age is required', min: { value: 0, message: 'Invalid age' } })}
                  />
                  {errors.age && <span className="text-[10px] text-red-500">{errors.age.message}</span>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Gender</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('gender', { required: 'Gender is required' })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <span className="text-[10px] text-red-500">{errors.gender.message}</span>}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('phone', { required: 'Mobile is required' })}
                  />
                  {errors.phone && <span className="text-[10px] text-red-500">{errors.phone.message}</span>}
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Blood Group</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('blood_group')}
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Residential Address</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-hidden"
                    {...register('address', { required: 'Address is required' })}
                  ></textarea>
                  {errors.address && <span className="text-[10px] text-red-500">{errors.address.message}</span>}
                </div>

                {/* Emergency Contact */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Emergency Contact Person</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white"
                    {...register('emergency_contact')}
                  />
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
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Patients;
