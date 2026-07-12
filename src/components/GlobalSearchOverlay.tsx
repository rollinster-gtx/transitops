/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Truck,
  Users,
  Compass,
  Wrench,
  Fuel,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from '../types';

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  onNavigateTab: (tab: any) => void;
}

export default function GlobalSearchOverlay({
  isOpen,
  onClose,
  vehicles,
  drivers,
  trips,
  maintenance,
  fuelLogs,
  expenses,
  onNavigateTab,
}: GlobalSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Search filter functions
  const matchingVehicles = cleanQuery
    ? vehicles.filter(
        (v) =>
          v.code.toLowerCase().includes(cleanQuery) ||
          v.name.toLowerCase().includes(cleanQuery) ||
          v.licensePlate.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingDrivers = cleanQuery
    ? drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(cleanQuery) ||
          d.licenseNumber.toLowerCase().includes(cleanQuery) ||
          (d.email && d.email.toLowerCase().includes(cleanQuery))
      )
    : [];

  const matchingTrips = cleanQuery
    ? trips.filter(
        (t) =>
          t.tripNumber.toLowerCase().includes(cleanQuery) ||
          t.routeName.toLowerCase().includes(cleanQuery) ||
          t.origin.toLowerCase().includes(cleanQuery) ||
          t.destination.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingMaint = cleanQuery
    ? maintenance.filter(
        (m) =>
          m.serviceType.toLowerCase().includes(cleanQuery) ||
          m.technicianName.toLowerCase().includes(cleanQuery) ||
          m.description.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingFuel = cleanQuery
    ? fuelLogs.filter(
        (f) =>
          f.stationName.toLowerCase().includes(cleanQuery) ||
          vehicles.find((v) => v.id === f.vehicleId)?.code.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingExpenses = cleanQuery
    ? expenses.filter(
        (e) =>
          e.category.toLowerCase().includes(cleanQuery) ||
          e.description.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults =
    matchingVehicles.length +
    matchingDrivers.length +
    matchingTrips.length +
    matchingMaint.length +
    matchingFuel.length +
    matchingExpenses.length;

  return (
    <div id="global-search-overlay" className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-10 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden mt-10 transition-colors duration-200">
        
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            id="global-search-input"
            ref={inputRef}
            type="text"
            placeholder="Search across fleet, drivers, trips, maintenance, expenses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          />
          <button
            id="close-search-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results grid */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
          {!cleanQuery ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Global System Search</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Type anything to instantly query all ledger files. Try codes like <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-500">TRK</span> or category names.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">No matches found for "{query}"</p>
              <p className="text-[11px] text-slate-500 mt-1">Verify filters or spelling and try again.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Vehicles category */}
              {matchingVehicles.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-2">
                    <Truck className="w-3.5 h-3.5" /> Vehicles ({matchingVehicles.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingVehicles.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          onNavigateTab('vehicles');
                          onClose();
                        }}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                            {v.code} - {v.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Type: {v.type} | plate: {v.licensePlate}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drivers category */}
              {matchingDrivers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-2">
                    <Users className="w-3.5 h-3.5" /> Drivers ({matchingDrivers.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingDrivers.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          onNavigateTab('drivers');
                          onClose();
                        }}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                            {d.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            License: {d.licenseNumber} | category: {d.licenseCategory}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trips category */}
              {matchingTrips.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-2">
                    <Compass className="w-3.5 h-3.5" /> Trips ({matchingTrips.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingTrips.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigateTab('trips');
                          onClose();
                        }}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                            {t.tripNumber} - {t.routeName}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {t.origin} ➔ {t.destination}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance category */}
              {matchingMaint.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-2">
                    <Wrench className="w-3.5 h-3.5" /> Maintenance Logs ({matchingMaint.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingMaint.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onNavigateTab('maintenance');
                          onClose();
                        }}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                            {m.serviceType} (${m.cost})
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Tech: {m.technicianName} | desc: {m.description}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fuel logs category */}
              {matchingFuel.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-2">
                    <Fuel className="w-3.5 h-3.5" /> Fuel Logs ({matchingFuel.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingFuel.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          onNavigateTab('fuel');
                          onClose();
                        }}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                            {f.gallons} Gal at {f.stationName}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Cost: ${f.cost} | date: {f.date}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses category */}
              {matchingExpenses.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-2">
                    <DollarSign className="w-3.5 h-3.5" /> Expenditures ({matchingExpenses.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingExpenses.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onNavigateTab('expenses');
                          onClose();
                        }}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                            {e.category} - ${e.amount}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Date: {e.date} | desc: {e.description}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold">
          <span>Search matches instantly populate</span>
          <div className="flex gap-2">
            <span>ESC to close</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
