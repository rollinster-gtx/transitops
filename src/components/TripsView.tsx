/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Plus,
  Search,
  Lock,
  X,
  User,
  Truck,
  MapPin,
  ArrowRightLeft,
  Users,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Edit,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Trip, Driver, Vehicle, Permission } from '../types';

interface TripsViewProps {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateTrip: (id: string, updates: Partial<Trip>) => void;
  permissions: Permission[];
}

export default function TripsView({
  trips,
  drivers,
  vehicles,
  onAddTrip,
  onUpdateTrip,
  permissions,
}: TripsViewProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [driverFilter, setDriverFilter] = useState<string>('All');

  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Updating logistics records...');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form states for creating a Trip
  const [routeName, setRouteName] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState(1000);
  const [plannedDistance, setPlannedDistance] = useState(50);
  const [startDate, setStartDate] = useState('2026-07-11T22:00');
  const [endDate, setEndDate] = useState('2026-07-11T23:30');
  const [tripFormStatus, setTripFormStatus] = useState<'Draft' | 'Dispatched'>('Draft');

  // Form states for editing a Trip
  const [editRouteName, setEditRouteName] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editVehicleId, setEditVehicleId] = useState('');
  const [editDriverId, setEditDriverId] = useState('');
  const [editCargoWeight, setEditCargoWeight] = useState(1000);
  const [editPlannedDistance, setEditPlannedDistance] = useState(50);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editTripStatus, setEditTripStatus] = useState<'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'>('Draft');

  const canCreate = permissions.includes('create');
  const canEdit = permissions.includes('edit');

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Business Rules for Drodown Filtering
  // Rule 1: Only Vehicles with status "Available" (or "Active" for backward compatibility) can be selected.
  // Rule 3: If Vehicle status is "On Trip", "In Shop" or "Retired", hide it from the dropdown.
  const selectableVehicles = vehicles.filter((v) => {
    const isAvailable = v.status === 'Available' || v.status === 'Active';
    const isHidden = v.status === 'On Trip' || v.status === 'In Shop' || v.status === 'Maintenance' || v.status === 'Retired' || v.status === 'Out of Service';
    return isAvailable && !isHidden;
  });

  // Rule 2: Only Drivers with status "Available" can be selected.
  // Rule 4: If Driver status is "On Trip" or "Suspended", hide it from the dropdown.
  const selectableDrivers = drivers.filter((d) => {
    const isAvailable = d.status === 'Available';
    const isHidden = d.status === 'On Trip' || d.status === 'Suspended';
    return isAvailable && !isHidden;
  });

  // Trigger Action with Loading Simulation
  const runSimulatedAction = (actionText: string, callback: () => void) => {
    setLoadingText(actionText);
    setIsActionLoading(true);
    setTimeout(() => {
      callback();
      setIsActionLoading(false);
    }, 75000 / 100); // ~750ms response delay for extreme satisfaction
  };

  // Create Submit handler
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination || !vehicleId || !driverId) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (cargoWeight <= 0 || plannedDistance <= 0) {
      showToast('Cargo weight and distance must be positive numbers.', 'error');
      return;
    }

    // Business Rule 5: Cargo Weight must never exceed Vehicle Maximum Load Capacity.
    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
    if (selectedVehicle && cargoWeight > selectedVehicle.maxLoadCapacity) {
      showToast(
        `Cargo Weight (${cargoWeight.toLocaleString()} lbs) exceeds Vehicle Maximum Capacity (${selectedVehicle.maxLoadCapacity.toLocaleString()} lbs for ${selectedVehicle.code})!`,
        'error'
      );
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast('Trip start date cannot be later than end date.', 'error');
      return;
    }

    const finalRouteName = routeName.trim() || `${source} to ${destination} Cargo Loop`;
    const tripNumber = 'TRIP-' + Math.floor(4000 + Math.random() * 5999);

    runSimulatedAction('Validating routing & dispatching run...', () => {
      onAddTrip({
        tripNumber,
        vehicleId,
        driverId,
        routeName: finalRouteName,
        origin: source,
        destination,
        scheduledDeparture: startDate,
        scheduledArrival: endDate,
        status: tripFormStatus,
        passengers: 0,
        stopsCount: Math.floor(1 + Math.random() * 6),
        cargoWeight,
        plannedDistance,
        startDate,
        endDate,
        source,
      });

      showToast(`Trip ${tripNumber} created successfully as ${tripFormStatus}!`, 'success');
      // Reset Create Form
      setRouteName('');
      setSource('');
      setDestination('');
      setCargoWeight(1000);
      setPlannedDistance(50);
      setShowAddForm(false);
    });
  };

  // Initialize Edit form
  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setEditRouteName(trip.routeName);
    setEditSource(trip.source || trip.origin);
    setEditDestination(trip.destination);
    setEditVehicleId(trip.vehicleId);
    setEditDriverId(trip.driverId);
    setEditCargoWeight(trip.cargoWeight || 1000);
    setEditPlannedDistance(trip.plannedDistance || 50);
    setEditStartDate(trip.startDate || trip.scheduledDeparture || '2026-07-11T22:00');
    setEditEndDate(trip.endDate || trip.scheduledArrival || '2026-07-11T23:30');
    setEditTripStatus(
      trip.status === 'Scheduled'
        ? 'Draft'
        : trip.status === 'En Route' || trip.status === 'Delayed'
          ? 'Dispatched'
          : (trip.status as any)
    );
  };

  // Edit Submit handler
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;

    if (!editSource || !editDestination || !editVehicleId || !editDriverId) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (editCargoWeight <= 0 || editPlannedDistance <= 0) {
      showToast('Cargo weight and distance must be positive numbers.', 'error');
      return;
    }

    // Business Rule 5: Cargo Weight must never exceed Vehicle Maximum Load Capacity.
    const selectedVehicle = vehicles.find((v) => v.id === editVehicleId);
    if (selectedVehicle && editCargoWeight > selectedVehicle.maxLoadCapacity) {
      showToast(
        `Cargo Weight (${editCargoWeight.toLocaleString()} lbs) exceeds Vehicle Maximum Capacity (${selectedVehicle.maxLoadCapacity.toLocaleString()} lbs for ${selectedVehicle.code})!`,
        'error'
      );
      return;
    }

    if (new Date(editStartDate) > new Date(editEndDate)) {
      showToast('Trip start date cannot be later than end date.', 'error');
      return;
    }

    runSimulatedAction('Updating logistics ledger...', () => {
      onUpdateTrip(editingTrip.id, {
        routeName: editRouteName,
        origin: editSource,
        destination: editDestination,
        vehicleId: editVehicleId,
        driverId: editDriverId,
        cargoWeight: editCargoWeight,
        plannedDistance: editPlannedDistance,
        scheduledDeparture: editStartDate,
        scheduledArrival: editEndDate,
        startDate: editStartDate,
        endDate: editEndDate,
        source: editSource,
        status: editTripStatus,
      });

      showToast(`Trip ${editingTrip.tripNumber} details updated successfully!`, 'success');
      setEditingTrip(null);
      if (selectedTrip?.id === editingTrip.id) {
        setSelectedTrip(null); // refresh details drawer
      }
    });
  };

  // Direct status transitions (Cancel/Complete/Dispatch)
  const handleUpdateStatusDirectly = (trip: Trip, newStatus: 'Dispatched' | 'Completed' | 'Cancelled') => {
    const actionText =
      newStatus === 'Dispatched'
        ? 'Activating vehicle transponder & operators...'
        : newStatus === 'Completed'
          ? 'Releasing carrier equipment & closing log...'
          : 'Refusing route clearance & cancelling run...';

    const confirmationMessage =
      newStatus === 'Cancelled'
        ? `Are you sure you want to cancel Trip run ${trip.tripNumber}?`
        : newStatus === 'Completed'
          ? `Mark Trip run ${trip.tripNumber} as Completed? This returns the vehicle and operator to Available status.`
          : `Dispatch Trip run ${trip.tripNumber} immediately? This sets vehicle and operator to On Trip.`;

    if (!confirm(confirmationMessage)) return;

    runSimulatedAction(actionText, () => {
      onUpdateTrip(trip.id, { status: newStatus });
      showToast(`Trip ${trip.tripNumber} status changed to ${newStatus}!`, 'success');
    });
  };

  // Normalized Status Mapping for Filtering & Rendering
  const getNormalizedStatus = (status: string): 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled' => {
    if (status === 'Scheduled') return 'Draft';
    if (status === 'En Route' || status === 'Delayed') return 'Dispatched';
    return status as any;
  };

  // Filtered and Searched Trips
  const filteredTrips = trips.filter((t) => {
    const normalizedStatus = getNormalizedStatus(t.status);
    const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter;
    const matchesVehicle = vehicleFilter === 'All' || t.vehicleId === vehicleFilter;
    const matchesDriver = driverFilter === 'All' || t.driverId === driverFilter;

    const v = vehicles.find((u) => u.id === t.vehicleId);
    const d = drivers.find((o) => o.id === t.driverId);

    const matchesSearch =
      t.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v && v.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d && d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesVehicle && matchesDriver && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl"
          >
            {toast.type === 'error' ? (
              <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : toast.type === 'info' ? (
              <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400">
                <Info className="w-5 h-5" />
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 text-xs font-semibold text-slate-100">
              {toast.message}
            </div>
            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isActionLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-400" />
              <Compass className="absolute w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <p className="mt-4 text-xs font-bold text-slate-300 font-mono tracking-wider uppercase">
              {loadingText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Active Transits</span>
          <span className="text-2xl font-bold text-sky-400 font-mono mt-2">
            {trips.filter((t) => getNormalizedStatus(t.status) === 'Dispatched').length}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Dispatched runs on the road</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Pending Orders</span>
          <span className="text-2xl font-bold text-amber-400 font-mono mt-2">
            {trips.filter((t) => getNormalizedStatus(t.status) === 'Draft').length}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Draft plans awaiting clearance</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Completed Deliveries</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono mt-2">
            {trips.filter((t) => getNormalizedStatus(t.status) === 'Completed').length}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Successful ledger arrivals</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Total Payload Logged</span>
          <span className="text-2xl font-bold text-slate-100 font-mono mt-2">
            {trips.reduce((acc, curr) => acc + (curr.cargoWeight || 0), 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">lbs</span>
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Cumulative weight transferred</span>
        </div>
      </div>

      {/* Control Panel (Search, Filters, Create) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Status filters */}
          <div className="flex flex-wrap rounded-xl border border-slate-800 p-1 bg-slate-950/40 gap-1 self-start">
            {(['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  statusFilter === s ? 'bg-slate-800 text-white border border-slate-700/80' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Create Button */}
          {canCreate ? (
            <button
              onClick={() => {
                // Pre-populate with first available driver and vehicle if they exist
                if (selectableVehicles.length > 0) setVehicleId(selectableVehicles[0].id);
                if (selectableDrivers.length > 0) setDriverId(selectableDrivers[0].id);
                setShowAddForm(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4.5 py-2.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule Dispatch Run
            </button>
          ) : (
            <div
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs px-4.5 py-2.5 border border-slate-700/60 cursor-not-allowed"
              title="Restricted by RBAC guidelines"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Dispatch Run Locked
            </div>
          )}
        </div>

        {/* Search, Filter select controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Trip ID, route, origin, vehicle code, operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 pl-9 pr-4 py-2.5 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code} ({v.type})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
            >
              <option value="All">All Drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trips list / Responsive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border-t border-slate-800/60 font-semibold text-xs flex flex-col items-center justify-center gap-2">
            <Compass className="w-8 h-8 text-slate-600 animate-pulse" />
            <span>No transit dispatch records match the search parameters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider border-b border-slate-800/80">
                  <th className="py-4 px-5">Trip Number</th>
                  <th className="py-4 px-4">Route Plan</th>
                  <th className="py-4 px-4">Origin / Destination</th>
                  <th className="py-4 px-4">Carrier Unit</th>
                  <th className="py-4 px-4">Operator</th>
                  <th className="py-4 px-4">Weight / Dist</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTrips.map((trip) => {
                  const v = vehicles.find((u) => u.id === trip.vehicleId);
                  const d = drivers.find((o) => o.id === trip.driverId);
                  const normalizedStatus = getNormalizedStatus(trip.status);

                  return (
                    <tr
                      key={trip.id}
                      className="hover:bg-slate-850/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTrip(trip)}
                    >
                      {/* ID */}
                      <td className="py-4 px-5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {trip.tripNumber}
                      </td>

                      {/* Route Name */}
                      <td className="py-4 px-4 font-semibold text-slate-200">
                        <div className="truncate max-w-[150px] group-hover:text-emerald-400 transition-colors" title={trip.routeName}>
                          {trip.routeName}
                        </div>
                      </td>

                      {/* Checkpoints */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 text-[11px] font-semibold">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                            <span className="truncate max-w-[110px]">{trip.source || trip.origin}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate max-w-[110px]">{trip.destination}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-4 px-4 font-semibold text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          <span>{v ? v.code : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-4 px-4 text-slate-300 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[100px]">{d ? d.name : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Payload */}
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                        <div className="flex flex-col">
                          <span>{(trip.cargoWeight || 1000).toLocaleString()} lbs</span>
                          <span className="text-[10px] text-slate-500">{(trip.plannedDistance || 50)} mi</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            normalizedStatus === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : normalizedStatus === 'Dispatched'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                : normalizedStatus === 'Cancelled'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {normalizedStatus}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            title="Inspect Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit ? (
                            <>
                              {/* Edit details */}
                              <button
                                onClick={() => handleOpenEdit(trip)}
                                title="Edit specs"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* State Transition Actions */}
                              {normalizedStatus === 'Draft' && (
                                <button
                                  onClick={() => handleUpdateStatusDirectly(trip, 'Dispatched')}
                                  className="text-[9px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-1 rounded-md cursor-pointer uppercase tracking-wider"
                                >
                                  Dispatch
                                </button>
                              )}

                              {normalizedStatus === 'Dispatched' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatusDirectly(trip, 'Completed')}
                                    className="text-[9px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md cursor-pointer uppercase tracking-wider"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatusDirectly(trip, 'Cancelled')}
                                    className="text-[9px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-md cursor-pointer uppercase tracking-wider"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic"><Lock className="w-3 h-3 text-amber-500 inline mr-0.5" /> Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW TRIP DETAILS DRAWER */}
      <AnimatePresence>
        {selectedTrip && (
          <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-xs">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setSelectedTrip(null)} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 font-mono tracking-wide">INSIDERS LOG</h4>
                      <h3 className="text-sm font-bold text-white">Route specs for {selectedTrip.tripNumber}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Box */}
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                    <span className="block text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Operational Status</span>
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          getNormalizedStatus(selectedTrip.status) === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : getNormalizedStatus(selectedTrip.status) === 'Dispatched'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              : getNormalizedStatus(selectedTrip.status) === 'Cancelled'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {getNormalizedStatus(selectedTrip.status)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Route: {selectedTrip.routeName}
                      </span>
                    </div>
                  </div>

                  {/* Route Checkpoints Details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">Checkpoints</h4>
                    <div className="relative pl-6 space-y-4 border-l border-slate-800">
                      <div className="relative">
                        <MapPin className="absolute -left-[30px] top-0.5 w-4 h-4 text-slate-500 bg-slate-900" />
                        <span className="text-[10px] text-slate-500 block uppercase font-bold font-mono">SOURCE/ORIGIN</span>
                        <span className="text-xs font-bold text-slate-200">{selectedTrip.source || selectedTrip.origin}</span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Depart: {selectedTrip.startDate || selectedTrip.scheduledDeparture}</p>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute -left-[30px] top-0.5 w-4 h-4 text-emerald-400 bg-slate-900" />
                        <span className="text-[10px] text-slate-500 block uppercase font-bold font-mono">DESTINATION TERMINUS</span>
                        <span className="text-xs font-bold text-slate-200">{selectedTrip.destination}</span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Arrive: {selectedTrip.endDate || selectedTrip.scheduledArrival}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cargo weights / Distance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850">
                      <span className="block text-[9px] font-bold text-slate-500 font-mono uppercase">Cargo Payload</span>
                      <span className="text-sm font-mono font-bold text-slate-200 mt-1 block">{(selectedTrip.cargoWeight || 1000).toLocaleString()} lbs</span>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850">
                      <span className="block text-[9px] font-bold text-slate-500 font-mono uppercase">Planned Distance</span>
                      <span className="text-sm font-mono font-bold text-slate-200 mt-1 block">{(selectedTrip.plannedDistance || 50)} miles</span>
                    </div>
                  </div>

                  {/* Carrier Unit details */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider mb-2">Assigned Carrier & Staff</h4>
                    <div className="space-y-2.5">
                      {/* Vehicle detail */}
                      <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-850 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">VEHICLE UNIT</span>
                            <span className="text-xs font-bold text-slate-200">
                              {vehicles.find((v) => v.id === selectedTrip.vehicleId)?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {vehicles.find((v) => v.id === selectedTrip.vehicleId)?.code || 'N/A'}
                        </span>
                      </div>

                      {/* Driver detail */}
                      <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-850 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">OPERATOR IN-CHARGE</span>
                            <span className="text-xs font-bold text-slate-200">
                              {drivers.find((d) => d.id === selectedTrip.driverId)?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs text-slate-400">
                          {drivers.find((d) => d.id === selectedTrip.driverId)?.licenseNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer actions footer */}
              {canEdit && getNormalizedStatus(selectedTrip.status) !== 'Completed' && getNormalizedStatus(selectedTrip.status) !== 'Cancelled' ? (
                <div className="border-t border-slate-800 pt-4 mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTrip(null);
                      handleOpenEdit(selectedTrip);
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center border border-slate-700"
                  >
                    Edit Specifications
                  </button>
                  {getNormalizedStatus(selectedTrip.status) === 'Draft' && (
                    <button
                      onClick={() => {
                        setSelectedTrip(null);
                        handleUpdateStatusDirectly(selectedTrip, 'Dispatched');
                      }}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Dispatch Trip
                    </button>
                  )}
                  {getNormalizedStatus(selectedTrip.status) === 'Dispatched' && (
                    <button
                      onClick={() => {
                        setSelectedTrip(null);
                        handleUpdateStatusDirectly(selectedTrip, 'Completed');
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Complete Trip
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic text-center border-t border-slate-850 pt-4">
                  Transits that are closed or cancelled are locked.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD/CREATE TRIP MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" /> Dispatch Route Planner
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Source & Destination */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Source / Origin *</label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Central Hub Terminal"
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Destination Terminus *</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="North Depot Terminal"
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Route Descriptor */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Route Custom Descriptor Name <span className="text-slate-500 italic">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g. Expressway Cargo Loop C"
                  className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Cargo payload & Planned distance */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Cargo Weight (lbs) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Planned Distance (mi) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Vehicle & Driver dropdown selection */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Assign Fleet Vehicle *</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
                  >
                    {selectableVehicles.length === 0 ? (
                      <option disabled value="">No vehicles available</option>
                    ) : (
                      selectableVehicles.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.code} - Max: {unit.maxLoadCapacity.toLocaleString()} lbs
                        </option>
                      ))
                    )}
                  </select>
                  <span className="text-[9px] text-slate-500 mt-1 block">Available vehicles listed only.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Assign Duty Operator *</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
                  >
                    {selectableDrivers.length === 0 ? (
                      <option disabled value="">No drivers available</option>
                    ) : (
                      selectableDrivers.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.name} (Score: {op.safetyScore})
                        </option>
                      ))
                    )}
                  </select>
                  <span className="text-[9px] text-slate-500 mt-1 block">Available drivers listed only.</span>
                </div>
              </div>

              {/* Departure & Arrival Epoch */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Departure Epoch *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Arrival Estimate *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Initial Status Selection */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 font-mono">Initial Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTripFormStatus('Draft')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                      tripFormStatus === 'Draft'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'bg-slate-900/40 text-slate-500 border border-transparent'
                    }`}
                  >
                    Draft Plan
                  </button>
                  <button
                    type="button"
                    disabled={selectableVehicles.length === 0 || selectableDrivers.length === 0}
                    onClick={() => setTripFormStatus('Dispatched')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                      tripFormStatus === 'Dispatched'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-900/40 text-slate-500 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    Dispatch Now
                  </button>
                </div>
              </div>

              {/* Submit trigger */}
              <button
                type="submit"
                disabled={selectableVehicles.length === 0 || selectableDrivers.length === 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register & Commit Dispatch Route
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* EDIT TRIP MODAL */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-400" /> Adjust Dispatch Route: {editingTrip.tripNumber}
              </h3>
              <button
                onClick={() => setEditingTrip(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Source & Destination */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Source / Origin *</label>
                  <input
                    type="text"
                    required
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Destination Terminus *</label>
                  <input
                    type="text"
                    required
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Route Descriptor */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Route Descriptor Name</label>
                <input
                  type="text"
                  required
                  value={editRouteName}
                  onChange={(e) => setEditRouteName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Cargo payload & Planned distance */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Cargo Weight (lbs) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editCargoWeight}
                    onChange={(e) => setEditCargoWeight(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Planned Distance (mi) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editPlannedDistance}
                    onChange={(e) => setEditPlannedDistance(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Vehicle & Driver dropdown selection */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Fleet Vehicle *</label>
                  <select
                    value={editVehicleId}
                    onChange={(e) => setEditVehicleId(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
                  >
                    {/* Include already assigned vehicle first, to not lose it if we edit */}
                    {vehicles.filter(v => v.id === editingTrip.vehicleId || selectableVehicles.some(sv => sv.id === v.id)).map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code} - Max: {unit.maxLoadCapacity.toLocaleString()} lbs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Operator In-Charge *</label>
                  <select
                    value={editDriverId}
                    onChange={(e) => setEditDriverId(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
                  >
                    {/* Include already assigned driver first */}
                    {drivers.filter(d => d.id === editingTrip.driverId || selectableDrivers.some(sd => sd.id === d.id)).map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} (Score: {op.safetyScore})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Departure & Arrival Epoch */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Departure Epoch *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Arrival Estimate *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Trip Status</label>
                <select
                  value={editTripStatus}
                  onChange={(e) => setEditTripStatus(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="Draft">Draft</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Save changes button */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Save Changes & Commit specs
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
