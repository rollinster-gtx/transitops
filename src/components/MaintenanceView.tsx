/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wrench,
  Plus,
  Search,
  Lock,
  X,
  Truck,
  DollarSign,
  User,
  AlertOctagon,
  Calendar,
} from 'lucide-react';
import { MaintenanceLog, Vehicle, Permission } from '../types';

interface MaintenanceViewProps {
  maintenance: MaintenanceLog[];
  vehicles: Vehicle[];
  onAddMaintenance: (maint: Omit<MaintenanceLog, 'id'>) => void;
  onUpdateMaintenance: (id: string, updates: Partial<MaintenanceLog>) => void;
  permissions: Permission[];
}

export default function MaintenanceView({
  maintenance,
  vehicles,
  onAddMaintenance,
  onUpdateMaintenance,
  permissions,
}: MaintenanceViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState<MaintenanceLog['serviceType']>('Routine Inspection');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(150);
  const [technicianName, setTechnicianName] = useState('');
  const [priority, setPriority] = useState<MaintenanceLog['priority']>('Low');

  const canCreate = permissions.includes('create');
  const canEdit = permissions.includes('edit');

  const filteredLogs = maintenance.filter((m) => {
    const v = vehicles.find((u) => u.id === m.vehicleId);
    const code = v ? v.code.toLowerCase() : '';
    return (
      m.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.includes(searchTerm.toLowerCase())
    );
  });

  const totalCost = filteredLogs.reduce((acc, curr) => acc + curr.cost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !technicianName) return;

    onAddMaintenance({
      vehicleId,
      serviceType,
      description,
      cost: Number(cost),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      technicianName,
      priority,
    });

    setDescription('');
    setTechnicianName('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics and overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-mono">TOTAL SERVICE LOGS</span>
          <span className="text-xl font-bold text-white font-mono">{maintenance.length} logs</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-mono">AGGREGATE EXPENDITURE</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">${totalCost.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-mono">IN PROGRESS</span>
          <span className="text-xl font-bold text-amber-400 font-mono">
            {maintenance.filter((m) => m.status === 'In Progress').length} tickets
          </span>
        </div>
      </div>

      {/* Filter and Trigger */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search mechanics, vehicle code, repair types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {canCreate ? (
          <button
            onClick={() => {
              if (vehicles.length === 0) {
                alert('No vehicles available.');
                return;
              }
              setVehicleId(vehicles[0].id);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Service Ticket
          </button>
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl bg-slate-800 text-slate-500 font-semibold text-xs px-4 py-2.5 border border-slate-700/60 cursor-not-allowed"
            title="Restricted by RBAC rules"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" /> Create Service Ticket (Locked)
          </div>
        )}
      </div>

      {/* Maintenance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLogs.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl font-semibold">
            No service orders recorded in this context.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const v = vehicles.find((u) => u.id === log.vehicleId);

            return (
              <motion.div
                key={log.id}
                layoutId={log.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Priority banner line */}
                  <div className="flex justify-between items-center mb-3.5">
                    <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                      Ticket #{log.id.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        log.priority === 'Critical'
                          ? 'bg-red-500/10 text-rose-400 border border-red-500/20'
                          : log.priority === 'High'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {log.priority} Priority
                    </span>
                  </div>

                  {/* Vehicle details */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-400 shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{v ? v.code : 'Unit Decommissioned'}</h4>
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{v ? v.name : ''}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        log.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.status === 'In Progress'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  {/* Type and Description */}
                  <div className="mt-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-200">{log.serviceType}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      {log.description}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{log.technicianName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>${log.cost} cost</span>
                    </div>
                  </div>
                </div>

                {/* Mechanic Actions */}
                <div className="mt-5 pt-4 border-t border-slate-850 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 font-bold">
                    <Calendar className="w-3.5 h-3.5" /> Filed {log.date}
                  </span>

                  {canEdit ? (
                    <div className="flex gap-1.5">
                      {(log.status === 'Scheduled' || log.status === 'Pending') && (
                        <button
                          onClick={() => onUpdateMaintenance(log.id, { status: 'In Progress' })}
                          className="text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                        >
                          Begin Work
                        </button>
                      )}
                      {log.status === 'In Progress' && (
                        <button
                          onClick={() => onUpdateMaintenance(log.id, { status: 'Completed' })}
                          className="text-[10px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                        >
                          Complete &amp; Sign-off
                        </button>
                      )}
                      {log.status === 'Completed' && (
                        <span className="text-[10px] text-emerald-400 font-bold italic">Signed-off ✓</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" /> Locked (RBAC)
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Ticket Dialog */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-400" /> Log Service Work-order
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Select Fleet Unit *</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {vehicles.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Service Category</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Routine Inspection">Routine Inspection</option>
                    <option value="Engine Repair">Engine Repair</option>
                    <option value="Brake Replacement">Brake Replacement</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Rotation">Tire Rotation</option>
                    <option value="Electrical Fix">Electrical Fix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Priority Urgency</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Mechanic / Tech Name *</label>
                  <input
                    type="text"
                    required
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="Sandro Ramirez"
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Estimated Repair Cost ($) *</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Problem Description / Diagnose *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Engine heating up on highways. Water pump gasket leak suspect."
                  rows={3}
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                File Service Work-order
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
