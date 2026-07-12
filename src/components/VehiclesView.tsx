/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Truck,
  Plus,
  Search,
  SlidersHorizontal,
  Lock,
  BatteryCharging,
  Fuel,
  TrendingUp,
  AlertTriangle,
  X,
  Gauge,
  Calendar,
  DollarSign,
  Pencil,
} from 'lucide-react';
import { Vehicle, Permission } from '../types';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
  permissions: Permission[];
}

export default function VehiclesView({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  permissions,
}: VehiclesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Maintenance' | 'Out of Service'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Bus' | 'Heavy Truck' | 'Delivery Van' | 'Shuttle'>('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'Bus' | 'Heavy Truck' | 'Delivery Van' | 'Shuttle'>('Bus');
  const [fuelType, setFuelType] = useState<'Diesel' | 'Electric' | 'CNG' | 'Hybrid'>('Diesel');
  const [mileage, setMileage] = useState(15000);
  const [licensePlate, setLicensePlate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [maxLoadCapacity, setMaxLoadCapacity] = useState(10000);
  const [acquisitionCost, setAcquisitionCost] = useState(50000);

  // Edit vehicle states
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'Bus' | 'Heavy Truck' | 'Delivery Van' | 'Shuttle'>('Bus');
  const [editFuelType, setEditFuelType] = useState<'Diesel' | 'Electric' | 'CNG' | 'Hybrid'>('Diesel');
  const [editMileage, setEditMileage] = useState(15000);
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [editYear, setEditYear] = useState(new Date().getFullYear());
  const [editRegistrationNumber, setEditRegistrationNumber] = useState('');
  const [editMaxLoadCapacity, setEditMaxLoadCapacity] = useState(10000);
  const [editAcquisitionCost, setEditAcquisitionCost] = useState(50000);
  const [editStatus, setEditStatus] = useState<'Active' | 'Maintenance' | 'Out of Service'>('Active');
  const [editFuelLevel, setEditFuelLevel] = useState(100);

  const canCreate = permissions.includes('create');
  const canEdit = permissions.includes('edit');
  const canDelete = permissions.includes('delete');

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !licensePlate || !registrationNumber) return;
    onAddVehicle({
      code,
      name,
      type,
      status: 'Active',
      mileage: Number(mileage),
      fuelType,
      fuelLevel: 100,
      licensePlate,
      year: Number(year),
      lastServiceDate: new Date().toISOString().split('T')[0],
      registrationNumber,
      maxLoadCapacity: Number(maxLoadCapacity),
      acquisitionCost: Number(acquisitionCost),
    });
    // Reset
    setCode('');
    setName('');
    setLicensePlate('');
    setRegistrationNumber('');
    setMaxLoadCapacity(10000);
    setAcquisitionCost(50000);
    setShowAddForm(false);
  };

  const startEditing = (v: Vehicle) => {
    setEditingVehicle(v);
    setEditCode(v.code);
    setEditName(v.name);
    setEditType(v.type);
    setEditFuelType(v.fuelType);
    setEditMileage(v.mileage);
    setEditLicensePlate(v.licensePlate);
    setEditYear(v.year);
    setEditRegistrationNumber(v.registrationNumber);
    setEditMaxLoadCapacity(v.maxLoadCapacity);
    setEditAcquisitionCost(v.acquisitionCost);
    setEditStatus(v.status);
    setEditFuelLevel(v.fuelLevel);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !editCode || !editName || !editLicensePlate || !editRegistrationNumber) return;
    onUpdateVehicle(editingVehicle.id, {
      code: editCode,
      name: editName,
      type: editType,
      fuelType: editFuelType,
      mileage: Number(editMileage),
      licensePlate: editLicensePlate,
      year: Number(editYear),
      registrationNumber: editRegistrationNumber,
      maxLoadCapacity: Number(editMaxLoadCapacity),
      acquisitionCost: Number(editAcquisitionCost),
      status: editStatus,
      fuelLevel: Number(editFuelLevel),
    });
    setEditingVehicle(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search code, vehicle name, plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {canCreate ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register Vehicle
            </button>
          ) : (
            <div
              className="flex items-center gap-2 rounded-xl bg-slate-800 text-slate-500 font-semibold text-xs px-4 py-2.5 border border-slate-700/60 cursor-not-allowed"
              title="Restricted by RBAC rules"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Register Vehicle (Locked)
            </div>
          )}
        </div>
      </div>

      {/* Dynamic filters box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mr-2 font-mono">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> FILTERS
        </div>

        {/* Status Filter buttons */}
        <div className="flex rounded-lg border border-slate-800 p-1 bg-slate-950/40 gap-1">
          {(['All', 'Active', 'Maintenance', 'Out of Service'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-[11px] font-bold rounded-md cursor-pointer transition-all ${
                statusFilter === s ? 'bg-slate-850 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Type Filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 font-mono">UNIT TYPE:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-[11px] font-semibold rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 py-1 px-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Bus">Bus</option>
            <option value="Heavy Truck">Heavy Truck</option>
            <option value="Delivery Van">Delivery Van</option>
            <option value="Shuttle">Shuttle</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid / Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.length === 0 ? (
          <div className="md:col-span-3 text-center py-12 text-xs text-slate-500 font-semibold">
            No active fleet units found matching criteria.
          </div>
        ) : (
          filteredVehicles.map((v) => (
            <motion.div
              key={v.id}
              layoutId={v.id}
              whileHover={{ y: -2 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              {/* Card top info */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-emerald-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 font-mono tracking-wide">{v.code}</h4>
                      <h3 className="text-xs font-bold text-white tracking-tight mt-0.5 truncate max-w-[150px]">
                        {v.name}
                      </h3>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      v.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : v.status === 'Maintenance'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                {/* Specs list */}
                <div className="space-y-2 mt-4 text-[11px] font-semibold text-slate-400">
                  <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                    <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-slate-500" /> Odometer</span>
                    <span className="text-white font-mono">{v.mileage.toLocaleString()} mi</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-slate-500" /> Registration No.</span>
                    <span className="text-white font-mono">{v.registrationNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                    <span className="flex items-center gap-1"><SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Max Load</span>
                    <span className="text-white font-mono">{(v.maxLoadCapacity || 0).toLocaleString()} lbs</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-500" /> Acquisition Cost</span>
                    <span className="text-emerald-400 font-mono">${(v.acquisitionCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-850/60 pb-1.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Year / Plate</span>
                    <span className="text-white font-mono">{v.year} • {v.licensePlate}</span>
                  </div>
                  <div className="flex justify-between pb-1.5">
                    <span className="flex items-center gap-1">
                      {v.fuelType === 'Electric' ? (
                        <BatteryCharging className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Energy Level ({v.fuelType})</span>
                    </span>
                    <span className="text-white font-mono">
                      {v.fuelLevel}%
                    </span>
                  </div>
                </div>

                {/* Fuel gauge visual bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2 relative">
                  <div
                    style={{ width: `${v.fuelLevel}%` }}
                    className={`h-full transition-all duration-500 ${
                      v.fuelLevel < 15
                        ? 'bg-rose-500'
                        : v.fuelLevel < 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Actions row with RBAC checking */}
              <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between gap-2.5">
                {canEdit ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => startEditing(v)}
                      className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 px-2.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" /> Edit Vehicle
                    </button>
                    <button
                      onClick={() =>
                        onUpdateVehicle(v.id, {
                          status: v.status === 'Active' ? 'Maintenance' : 'Active',
                        })
                      }
                      className="text-[10px] font-bold bg-slate-850 hover:bg-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg border border-slate-805 transition-colors cursor-pointer"
                    >
                      Toggle Status
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic flex items-center gap-1.5 font-mono">
                    <Lock className="w-3 h-3 text-amber-500" /> READ-ONLY (RBAC)
                  </span>
                )}

                {canDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to decommission unit ${v.code}?`)) {
                        onDeleteVehicle(v.id);
                      }
                    }}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Decommission
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Vehicle drawer/dialog modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" /> Register New Fleet Unit
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="BUS-105"
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Plate *</label>
                  <input
                    type="text"
                    required
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="TX-F-0010"
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Metro Coach Transit"
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="REG-TX-98711"
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Max Load Capacity (lbs) *</label>
                  <input
                    type="number"
                    required
                    value={maxLoadCapacity}
                    onChange={(e) => setMaxLoadCapacity(Number(e.target.value))}
                    placeholder="10000"
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Acquisition Cost (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      required
                      value={acquisitionCost}
                      onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                      placeholder="50000"
                      className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 pl-7 pr-2.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Vehicle Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Shuttle">Shuttle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Initial Mileage</label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    placeholder="15000"
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    placeholder="2024"
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Commit Fleet Entry
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Vehicle drawer/dialog modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" /> Edit Fleet Unit: {editingVehicle.code}
              </h3>
              <button
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Code *</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">License Plate *</label>
                  <input
                    type="text"
                    required
                    value={editLicensePlate}
                    onChange={(e) => setEditLicensePlate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={editRegistrationNumber}
                    onChange={(e) => setEditRegistrationNumber(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Max Load Capacity (lbs) *</label>
                  <input
                    type="number"
                    required
                    value={editMaxLoadCapacity}
                    onChange={(e) => setEditMaxLoadCapacity(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Acquisition Cost (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      required
                      value={editAcquisitionCost}
                      onChange={(e) => setEditAcquisitionCost(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 pl-7 pr-2.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Odometer (mi) *</label>
                  <input
                    type="number"
                    required
                    value={editMileage}
                    onChange={(e) => setEditMileage(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Vehicle Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Shuttle">Shuttle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Fuel Type</label>
                  <select
                    value={editFuelType}
                    onChange={(e) => setEditFuelType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Fuel / Energy Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editFuelLevel}
                    onChange={(e) => setEditFuelLevel(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Year</label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
