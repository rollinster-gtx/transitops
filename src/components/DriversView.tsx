/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  Lock,
  X,
  CreditCard,
  ShieldCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle,
  SlidersHorizontal,
  Pencil,
  Activity,
  Filter,
  Check,
  User,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Driver, Permission } from '../types';

interface DriversViewProps {
  drivers: Driver[];
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onUpdateDriver: (id: string, updates: Partial<Driver>) => void;
  onDeleteDriver: (id: string) => void;
  permissions: Permission[];
}

export default function DriversView({
  drivers,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  permissions,
}: DriversViewProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLicense, setSearchLicense] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'>('All');

  // Sorting state
  const [sortBy, setSortBy] = useState<'name' | 'safetyScore' | 'licenseExpiryDate' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // View style
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals & Action overlays
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // UX Feedback States
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Add Form Inputs
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('CDL Class A');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState(95);
  const [status, setStatus] = useState<'Available' | 'On Trip' | 'Off Duty' | 'Suspended'>('Available');

  // Edit Form Inputs
  const [editName, setEditName] = useState('');
  const [editLicenseNumber, setEditLicenseNumber] = useState('');
  const [editLicenseCategory, setEditLicenseCategory] = useState('');
  const [editLicenseExpiryDate, setEditLicenseExpiryDate] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editSafetyScore, setEditSafetyScore] = useState(95);
  const [editStatus, setEditStatus] = useState<'Available' | 'On Trip' | 'Off Duty' | 'Suspended'>('Available');

  // Role permissions checks
  const canCreate = permissions.includes('create');
  const canEdit = permissions.includes('edit');
  const canDelete = permissions.includes('delete');

  // Helper to trigger transient elegant toast alerts
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Validators
  const validateAddForm = () => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!licenseNumber.trim()) {
      errors.licenseNumber = 'License number is required';
    } else {
      const exists = drivers.some((d) => d.licenseNumber.trim().toLowerCase() === licenseNumber.trim().toLowerCase());
      if (exists) {
        errors.licenseNumber = 'License number must be unique';
      }
    }

    if (!licenseExpiryDate) {
      errors.licenseExpiryDate = 'License expiry date cannot be empty';
    }

    const phoneDigits = contactNumber.replace(/\D/g, '');
    if (!contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else if (phoneDigits.length < 7) {
      errors.contactNumber = 'Contact number must contain at least 7 digits';
    }

    if (safetyScore === undefined || safetyScore === null || isNaN(safetyScore)) {
      errors.safetyScore = 'Safety score is required';
    } else if (safetyScore < 0 || safetyScore > 100) {
      errors.safetyScore = 'Safety score must be between 0 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: { [key: string]: string } = {};

    if (!editName.trim()) {
      errors.editName = 'Full name is required';
    }

    if (!editLicenseNumber.trim()) {
      errors.editLicenseNumber = 'License number is required';
    } else if (editingDriver) {
      const exists = drivers.some(
        (d) => d.licenseNumber.trim().toLowerCase() === editLicenseNumber.trim().toLowerCase() && d.id !== editingDriver.id
      );
      if (exists) {
        errors.editLicenseNumber = 'License number must be unique';
      }
    }

    if (!editLicenseExpiryDate) {
      errors.editLicenseExpiryDate = 'License expiry date cannot be empty';
    }

    const phoneDigits = editContactNumber.replace(/\D/g, '');
    if (!editContactNumber.trim()) {
      errors.editContactNumber = 'Contact number is required';
    } else if (phoneDigits.length < 7) {
      errors.editContactNumber = 'Contact number must contain at least 7 digits';
    }

    if (editSafetyScore === undefined || editSafetyScore === null || isNaN(editSafetyScore)) {
      errors.editSafetyScore = 'Safety score is required';
    } else if (editSafetyScore < 0 || editSafetyScore > 100) {
      errors.editSafetyScore = 'Safety score must be between 0 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // State Change Wrappers (Reset pagination to page 1 on search/filters change)
  const handleSearchNameChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleSearchLicenseChange = (val: string) => {
    setSearchLicense(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: typeof statusFilter) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Sorting toggles
  const requestSort = (key: typeof sortBy) => {
    let order: typeof sortOrder = 'asc';
    if (sortBy === key && sortOrder === 'asc') {
      order = 'desc';
    }
    setSortBy(key);
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Process data filtering
  const filteredDrivers = drivers.filter((d) => {
    const matchesName = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLicense = (d.licenseNumber || '').toLowerCase().includes(searchLicense.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesName && matchesLicense && matchesStatus;
  });

  // Process data sorting
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'name') {
      comp = a.name.localeCompare(b.name);
    } else if (sortBy === 'safetyScore') {
      comp = (a.safetyScore ?? 0) - (b.safetyScore ?? 0);
    } else if (sortBy === 'licenseExpiryDate') {
      comp = (a.licenseExpiryDate || '').localeCompare(b.licenseExpiryDate || '');
    } else if (sortBy === 'status') {
      comp = a.status.localeCompare(b.status);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  // Process pagination
  const totalItems = sortedDrivers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDrivers = sortedDrivers.slice(startIndex, startIndex + itemsPerPage);

  // Form Submissions
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) {
      triggerToast('Validation checks failed. Please inspect errors.', 'error');
      return;
    }

    setIsActionLoading(true);
    setTimeout(() => {
      // Backwards compatibility fields
      const names = name.trim().split(' ');
      const firstName = names[0] || 'driver';
      const lastName = names[1] || 'operator';
      const fallbackEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@transitops.com`;

      onAddDriver({
        name: name.trim(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        licenseCategory,
        licenseExpiryDate,
        contactNumber: contactNumber.trim(),
        safetyScore: Number(safetyScore),
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        email: fallbackEmail,
        phone: contactNumber.trim(),
        licenseType: licenseCategory as any,
        rating: Number((safetyScore / 20).toFixed(1)),
        assignedVehicleId: null,
        joinedDate: new Date().toISOString().split('T')[0],
      });

      // Reset
      setName('');
      setLicenseNumber('');
      setLicenseCategory('CDL Class A');
      setLicenseExpiryDate('');
      setContactNumber('');
      setSafetyScore(95);
      setStatus('Available');
      setFormErrors({});
      setShowAddForm(false);
      setIsActionLoading(false);

      triggerToast(`Operator ${name} successfully enlisted!`, 'success');
    }, 400);
  };

  const startEditing = (d: Driver) => {
    setEditingDriver(d);
    setEditName(d.name);
    setEditLicenseNumber(d.licenseNumber);
    setEditLicenseCategory(d.licenseCategory || d.licenseType || 'CDL Class A');
    setEditLicenseExpiryDate(d.licenseExpiryDate || '2028-01-01');
    setEditContactNumber(d.contactNumber || d.phone || '');
    setEditSafetyScore(d.safetyScore !== undefined ? d.safetyScore : Math.round((d.rating || 4.5) * 20));
    setEditStatus(d.status);
    setFormErrors({});
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;

    if (!validateEditForm()) {
      triggerToast('Validation checks failed. Please inspect errors.', 'error');
      return;
    }

    setIsActionLoading(true);
    setTimeout(() => {
      onUpdateDriver(editingDriver.id, {
        name: editName.trim(),
        licenseNumber: editLicenseNumber.trim().toUpperCase(),
        licenseCategory: editLicenseCategory,
        licenseExpiryDate: editLicenseExpiryDate,
        contactNumber: editContactNumber.trim(),
        safetyScore: Number(editSafetyScore),
        status: editStatus,
        updatedAt: new Date().toISOString(),
        // backwards compat
        phone: editContactNumber.trim(),
        licenseType: editLicenseCategory as any,
        rating: Number((editSafetyScore / 20).toFixed(1)),
      });

      setEditingDriver(null);
      setIsActionLoading(false);
      triggerToast(`Details for ${editName} successfully updated.`, 'success');
    }, 400);
  };

  const startDeleting = (d: Driver) => {
    setDeleteConfirmationId(d.id);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmationId) return;
    const target = drivers.find((d) => d.id === deleteConfirmationId);
    if (!target) return;

    setIsActionLoading(true);
    setTimeout(() => {
      onDeleteDriver(deleteConfirmationId);
      setDeleteConfirmationId(null);
      setIsActionLoading(false);
      triggerToast(`Operator ${target.name} removed from registry.`, 'success');
    }, 400);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast alert indicator */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-400'
                : toast.type === 'error'
                  ? 'bg-slate-900/90 border-rose-500/30 text-rose-400'
                  : 'bg-slate-900/90 border-sky-500/30 text-sky-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="text-xs font-bold font-sans">{toast.message}</span>
            <button onClick={() => setToast(null)} className="hover:text-white transition-colors cursor-pointer ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Panel */}
      <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {/* Search by Name */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => handleSearchNameChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                id="search-name-input"
              />
            </div>
            {/* Search by License Number */}
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by license plate/no..."
                value={searchLicense}
                onChange={(e) => handleSearchLicenseChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                id="search-license-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* View style toggle switcher */}
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md cursor-pointer transition-all ${
                  viewMode === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Table Roster View"
                id="view-table-btn"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer transition-all ${
                  viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Bento Card Grid"
                id="view-grid-btn"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Enlist button */}
            {canCreate ? (
              <button
                onClick={() => {
                  setFormErrors({});
                  setShowAddForm(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 transition-all shadow-md cursor-pointer"
                id="add-driver-btn"
              >
                <Plus className="w-4 h-4" /> Enlist Operator
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 rounded-xl bg-slate-800/40 text-slate-500 font-bold text-xs px-4 py-2.5 border border-slate-800/80 cursor-not-allowed font-mono"
                title="Requires Admin permissions"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" /> Enlist Operators (Locked)
              </div>
            )}
          </div>
        </div>

        {/* Status Duty Filter */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-3.5">
          <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5 text-slate-600" /> FILTER STATUS:
          </span>
          <div className="flex flex-wrap gap-1">
            {(['All', 'Available', 'On Trip', 'Off Duty', 'Suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusFilterChange(st)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer border transition-all ${
                  statusFilter === st
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/20'
                    : 'text-slate-400 hover:text-white border-transparent bg-transparent hover:bg-slate-800/30'
                }`}
                id={`status-filter-${st}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Roster List */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          /* Table Roster View style */
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]" id="drivers-table">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/45 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <th className="py-4 px-5">
                      <button
                        onClick={() => requestSort('name')}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        id="sort-name-header"
                      >
                        Operator Name
                        {sortBy === 'name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4">License Credentials</th>
                    <th className="py-4 px-4">
                      <button
                        onClick={() => requestSort('licenseExpiryDate')}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        id="sort-expiry-header"
                      >
                        Expiry Date
                        {sortBy === 'licenseExpiryDate' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4">Contact Details</th>
                    <th className="py-4 px-4 text-center">
                      <button
                        onClick={() => requestSort('safetyScore')}
                        className="flex items-center gap-1 mx-auto hover:text-white transition-colors cursor-pointer"
                        id="sort-safety-header"
                      >
                        Safety Score
                        {sortBy === 'safetyScore' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4">
                      <button
                        onClick={() => requestSort('status')}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                        id="sort-status-header"
                      >
                        Status
                        {sortBy === 'status' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {currentDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500 font-semibold italic">
                        No transit operators matching specified parameters were found.
                      </td>
                    </tr>
                  ) : (
                    currentDrivers.map((d) => {
                      const isExpiringSoon = d.licenseExpiryDate
                        ? new Date(d.licenseExpiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                        : false;

                      return (
                        <tr key={d.id} className="hover:bg-slate-900/40 transition-colors" id={`driver-row-${d.id}`}>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400 uppercase select-none shrink-0">
                                {d.name.slice(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-100 hover:text-emerald-400 cursor-pointer block" onClick={() => setViewingDriver(d)}>
                                  {d.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono block">ID: {d.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-semibold text-slate-300">{d.licenseCategory || d.licenseType || 'CDL Class A'}</div>
                            <div className="text-[10px] text-slate-500">{d.licenseNumber}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className={`inline-flex items-center gap-1 ${isExpiringSoon ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                              {d.licenseExpiryDate || 'N/A'}
                              {isExpiringSoon && <AlertCircle className="w-3 h-3" title="Expiring within 30 days!" />}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono">
                            <div>{d.contactNumber || d.phone || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500 lowercase">{d.email || 'N/A'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-center justify-center gap-1 min-w-[70px]">
                              <span className={`font-bold font-mono text-xs ${
                                (d.safetyScore ?? 90) >= 90
                                  ? 'text-emerald-400'
                                  : (d.safetyScore ?? 90) >= 80
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                              }`}>
                                {d.safetyScore ?? Math.round((d.rating || 4.5) * 20)}
                              </span>
                              <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850/60">
                                <div
                                  className={`h-full ${
                                    (d.safetyScore ?? 90) >= 90
                                      ? 'bg-emerald-500'
                                      : (d.safetyScore ?? 90) >= 80
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${d.safetyScore ?? (d.rating || 4.5) * 20}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                d.status === 'Available'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : d.status === 'On Trip'
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                    : d.status === 'Off Duty'
                                      ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingDriver(d)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="View Details"
                                id={`view-details-${d.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canEdit ? (
                                <button
                                  onClick={() => startEditing(d)}
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Credentials"
                                  id={`edit-driver-${d.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="p-1.5 text-slate-600 cursor-not-allowed" title="RBAC Read-only">
                                  <Lock className="w-3.5 h-3.5 text-amber-500/60" />
                                </span>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => startDeleting(d)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/10 rounded-lg transition-colors cursor-pointer"
                                  title="Decommission Roster Node"
                                  id={`delete-driver-${d.id}`}
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* Bento Card Grid View Style */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {currentDrivers.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-xs text-slate-500 font-semibold italic">
                No logistics operators matching specified parameters were found.
              </div>
            ) : (
              currentDrivers.map((d) => (
                <motion.div
                  key={d.id}
                  whileHover={{ y: -2 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                  id={`driver-card-${d.id}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-sm text-emerald-400 uppercase select-none">
                          {d.name.slice(0, 2)}
                        </div>
                        <div>
                          <h3
                            className="text-xs font-bold text-white tracking-tight hover:text-emerald-400 cursor-pointer"
                            onClick={() => setViewingDriver(d)}
                          >
                            {d.name}
                          </h3>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {d.id}</p>
                        </div>
                      </div>

                      {/* Safety ratings badge */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-850/80 px-2.5 py-0.5 rounded-lg text-amber-400 font-mono">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-bold">{(d.safetyScore ? d.safetyScore / 20 : d.rating || 4.5).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Status Badging */}
                    <div className="mb-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                          d.status === 'Available'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : d.status === 'On Trip'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              : d.status === 'Off Duty'
                                ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>

                    {/* Specs List details */}
                    <div className="space-y-2 mt-2 text-[11px] font-semibold text-slate-400">
                      <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Contact</span>
                        <span className="truncate text-white font-mono">{d.contactNumber || d.phone}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                        <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-slate-500" /> License</span>
                        <span className="text-white font-mono">{d.licenseCategory || d.licenseType || 'CDL Class A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Expiry</span>
                        <span className="text-white font-mono">{d.licenseExpiryDate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-slate-500" /> Safety Score</span>
                        <span className="text-emerald-400 font-bold font-mono">{d.safetyScore || 95}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3.5 border-t border-slate-850/60 flex items-center justify-between">
                    <button
                      onClick={() => setViewingDriver(d)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      View Details
                    </button>

                    <div className="flex items-center gap-2">
                      {canEdit ? (
                        <button
                          onClick={() => startEditing(d)}
                          className="text-[10px] font-bold bg-slate-850 hover:bg-slate-800 text-emerald-400 py-1.5 px-2.5 rounded-lg border border-slate-800 transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic flex items-center gap-1 font-mono">
                          <Lock className="w-3 h-3 text-amber-500" /> READ-ONLY
                        </span>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => startDeleting(d)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/10 transition-colors cursor-pointer"
                          title="Decommission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination footer interface */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-sm font-mono text-xs">
        <div className="text-slate-400">
          Showing <span className="text-white font-bold">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
          <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
          <span className="text-emerald-400 font-bold">{totalItems}</span> registered operators
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 transition-colors cursor-pointer ${
              currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-white'
            }`}
            id="prev-page-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`h-8 w-8 rounded-xl font-bold transition-all border cursor-pointer ${
                currentPage === i + 1
                  ? 'bg-slate-800 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
              id={`page-btn-${i + 1}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 transition-colors cursor-pointer ${
              currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-white'
            }`}
            id="next-page-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW MODAL: Operator Details Profile Sheet */}
      {viewingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            id="view-driver-details-modal"
          >
            <button
              onClick={() => setViewingDriver(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white rounded-xl p-1.5 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-800">
              <div className="h-20 w-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-3xl text-emerald-400 uppercase select-none">
                {viewingDriver.name.slice(0, 2)}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h3 className="text-lg font-bold text-white leading-none">{viewingDriver.name}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                      viewingDriver.status === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : viewingDriver.status === 'On Trip'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : viewingDriver.status === 'Off Duty'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {viewingDriver.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">Registry Index Node ID: {viewingDriver.id}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 text-xs font-bold pt-1.5">
                  <Star className="w-4 h-4 fill-current shrink-0" />
                  <span className="font-mono">{(viewingDriver.safetyScore ? viewingDriver.safetyScore / 20 : viewingDriver.rating || 4.5).toFixed(1)} Safety Class</span>
                  <span className="text-slate-500 font-normal font-mono ml-1.5">• Joined {viewingDriver.joinedDate || '2022-01-01'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">License Category</span>
                <span className="text-white font-bold">{viewingDriver.licenseCategory || viewingDriver.licenseType || 'CDL Class A'}</span>
              </div>
              <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">License Number</span>
                <span className="text-white font-bold uppercase">{viewingDriver.licenseNumber || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Expiration Date</span>
                <span className="text-white font-bold">{viewingDriver.licenseExpiryDate || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Safety Score Rating</span>
                <span className="text-emerald-400 font-bold font-mono">{viewingDriver.safetyScore || 95}/100 score</span>
              </div>
              <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Contact Phone</span>
                <span className="text-white font-bold">{viewingDriver.contactNumber || viewingDriver.phone || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Operator Email</span>
                <span className="text-white font-bold truncate block select-all lowercase">{viewingDriver.email || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 border border-slate-850/60 p-3 rounded-xl col-span-2 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">System Timestamps</span>
                <span className="text-slate-400 text-[10px] block font-semibold">Registered: {viewingDriver.createdAt ? new Date(viewingDriver.createdAt).toLocaleString() : 'N/A'}</span>
                <span className="text-slate-400 text-[10px] block font-semibold">Last Updated: {viewingDriver.updatedAt ? new Date(viewingDriver.updatedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingDriver(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CONFIRMATION OVERLAY: Decommission Confirmation Dialog */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
            id="delete-confirmation-modal"
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="bg-rose-500/10 p-2 rounded-lg">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Decommission Operator</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you absolutely sure you want to remove{' '}
              <span className="text-white font-bold font-sans">
                {drivers.find((d) => d.id === deleteConfirmationId)?.name}
              </span>{' '}
              from the operational transit dispatch directories? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                id="cancel-delete-btn"
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                id="confirm-delete-btn"
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Deleting...' : 'Decommission'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DIALOG MODAL: Add Logistics Operator Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-8"
            id="add-driver-modal"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Enlist Transit Operator
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Rostova"
                  className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                    formErrors.name ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                  }`}
                  id="add-driver-name"
                />
                {formErrors.name && (
                  <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.name}
                  </span>
                )}
              </div>

              {/* License Number & Category */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Number *</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="CDL-TX-48910"
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none uppercase ${
                      formErrors.licenseNumber ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="add-driver-license-number"
                  />
                  {formErrors.licenseNumber && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.licenseNumber}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Category</label>
                  <select
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    id="add-driver-license-category"
                  >
                    <option value="CDL Class A">CDL Class A</option>
                    <option value="CDL Class B">CDL Class B</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              {/* License Expiry & Contact Number */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Expiry *</label>
                  <input
                    type="date"
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                      formErrors.licenseExpiryDate ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="add-driver-license-expiry"
                  />
                  {formErrors.licenseExpiryDate && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.licenseExpiryDate}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Contact Number *</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                      formErrors.contactNumber ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="add-driver-contact"
                  />
                  {formErrors.contactNumber && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.contactNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Safety Score & Status */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Safety Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(Number(e.target.value))}
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                      formErrors.safetyScore ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="add-driver-safety-score"
                  />
                  {formErrors.safetyScore && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.safetyScore}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    id="add-driver-status"
                  >
                    <option value="Available">Available</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                id="add-driver-submit-btn"
              >
                {isActionLoading ? 'Saving...' : 'Register & Enlist Operator'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DIALOG MODAL: Edit Logistics Operator Form */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-8"
            id="edit-driver-modal"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" /> Edit Operator: {editingDriver.id}
              </h3>
              <button
                onClick={() => setEditingDriver(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                    formErrors.editName ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                  }`}
                  id="edit-driver-name"
                />
                {formErrors.editName && (
                  <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.editName}
                  </span>
                )}
              </div>

              {/* License Credentials */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Number *</label>
                  <input
                    type="text"
                    value={editLicenseNumber}
                    onChange={(e) => setEditLicenseNumber(e.target.value)}
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none uppercase ${
                      formErrors.editLicenseNumber ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="edit-driver-license-number"
                  />
                  {formErrors.editLicenseNumber && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.editLicenseNumber}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Category</label>
                  <select
                    value={editLicenseCategory}
                    onChange={(e) => setEditLicenseCategory(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    id="edit-driver-license-category"
                  >
                    <option value="CDL Class A">CDL Class A</option>
                    <option value="CDL Class B">CDL Class B</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              {/* License Expiry & Contact Number */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Expiry *</label>
                  <input
                    type="date"
                    value={editLicenseExpiryDate}
                    onChange={(e) => setEditLicenseExpiryDate(e.target.value)}
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                      formErrors.editLicenseExpiryDate ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="edit-driver-license-expiry"
                  />
                  {formErrors.editLicenseExpiryDate && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.editLicenseExpiryDate}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Contact Number *</label>
                  <input
                    type="text"
                    value={editContactNumber}
                    onChange={(e) => setEditContactNumber(e.target.value)}
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                      formErrors.editContactNumber ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="edit-driver-contact"
                  />
                  {formErrors.editContactNumber && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.editContactNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Safety Score & Status */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Safety Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editSafetyScore}
                    onChange={(e) => setEditSafetyScore(Number(e.target.value))}
                    className={`w-full text-xs rounded-xl border bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none ${
                      formErrors.editSafetyScore ? 'border-rose-500/60 focus:border-rose-500' : 'border-slate-700'
                    }`}
                    id="edit-driver-safety-score"
                  />
                  {formErrors.editSafetyScore && (
                    <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.editSafetyScore}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    id="edit-driver-status"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                id="edit-driver-submit-btn"
              >
                {isActionLoading ? 'Saving...' : 'Save Operator Credentials'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
