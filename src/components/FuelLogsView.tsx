/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Fuel,
  Plus,
  Search,
  Lock,
  X,
  Truck,
  User,
  DollarSign,
  Calendar,
  Gauge,
} from 'lucide-react';
import { FuelLog, Vehicle, Driver, Permission } from '../types';

interface FuelLogsViewProps {
  fuelLogs: FuelLog[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onAddFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  permissions: Permission[];
}

export default function FuelLogsView({
  fuelLogs,
  vehicles,
  drivers,
  onAddFuelLog,
  permissions,
}: FuelLogsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [gallons, setGallons] = useState(30);
  const [cost, setCost] = useState(120);
  const [odometerReading, setOdometerReading] = useState(100000);
  const [stationName, setStationName] = useState('');

  const canCreate = permissions.includes('create');

  const filteredLogs = fuelLogs.filter((log) => {
    const v = vehicles.find((u) => u.id === log.vehicleId);
    const d = drivers.find((o) => o.id === log.driverId);
    const vehicleCode = v ? v.code.toLowerCase() : '';
    const driverName = d ? d.name.toLowerCase() : '';

    return (
      log.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleCode.includes(searchTerm.toLowerCase()) ||
      driverName.includes(searchTerm.toLowerCase())
    );
  });

  const totalCost = filteredLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const totalGallons = filteredLogs.reduce((acc, curr) => acc + curr.gallons, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverId || !stationName) return;

    onAddFuelLog({
      vehicleId,
      driverId,
      date: new Date().toISOString().split('T')[0],
      gallons: Number(gallons),
      cost: Number(cost),
      odometerReading: Number(odometerReading),
      stationName,
    });

    setStationName('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-mono">TOTAL VOLUME PUMPED</span>
          <span className="text-xl font-bold text-white font-mono">
            {totalGallons.toFixed(1)} gal
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-mono">CUMULATIVE FUEL BILL</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 font-mono">AVG UNIT PRICE</span>
          <span className="text-xl font-bold text-white font-mono">
            ${totalGallons > 0 ? (totalCost / totalGallons).toFixed(2) : '0.00'}/gal
          </span>
        </div>
      </div>

      {/* Filter and Trigger */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search station, vehicle code, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {canCreate ? (
          <button
            onClick={() => {
              if (vehicles.length === 0 || drivers.length === 0) {
                alert('Must have active vehicles and drivers to log refuel details.');
                return;
              }
              setVehicleId(vehicles[0].id);
              setDriverId(drivers[0].id);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Fuel Refill
          </button>
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl bg-slate-800 text-slate-500 font-semibold text-xs px-4 py-2.5 border border-slate-700/60 cursor-not-allowed"
            title="Restricted by RBAC rules"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" /> Log Fuel Refill (Locked)
          </div>
        )}
      </div>

      {/* Table view for logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Vehicle Unit</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Operator</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Station Node</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono text-right">Fuel Volume</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono text-right">Refuel Cost</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono text-right">Odometer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-xs text-slate-500 font-semibold">
                    No refueling logs filed.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const v = vehicles.find((u) => u.id === log.vehicleId);
                  const d = drivers.find((o) => o.id === log.driverId);

                  return (
                    <tr key={log.id} className="hover:bg-slate-850/20 transition-colors text-xs font-semibold text-slate-300">
                      <td className="px-6 py-4 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{log.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-white">{v ? v.code : 'N/A'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{d ? d.name : 'N/A'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-normal text-slate-400">{log.stationName}</td>
                      <td className="px-6 py-4 text-right text-slate-200 font-mono">{log.gallons.toFixed(1)} gal</td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-mono">${log.cost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-slate-400 font-mono">
                        <span className="flex items-center justify-end gap-1">
                          <Gauge className="w-3 h-3 text-slate-600" /> {log.odometerReading.toLocaleString()} mi
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Refuel Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-400" /> Log Fleet Refueling Refill
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Fleet Unit *</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {vehicles.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Duty Operator *</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {drivers.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Refueling Station Node Name *</label>
                <input
                  type="text"
                  required
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="Shell Station #208 North"
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Volume (Gal) *</label>
                  <input
                    type="number"
                    required
                    value={gallons}
                    onChange={(e) => setGallons(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Total Cost ($) *</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Odometer (mi) *</label>
                  <input
                    type="number"
                    required
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Record Fuel Log
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
