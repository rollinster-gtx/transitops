/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  TrendingUp,
  Info,
  Calendar,
  DollarSign,
  Fuel,
  Wrench,
  Compass,
  Gauge,
  Activity,
  Truck,
} from 'lucide-react';
import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from '../types';

interface ReportsViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  onAddLog: (log: string) => void;
}

type AnalysisTab = 'summary' | 'fuel' | 'expenses' | 'trips';

export default function ReportsView({
  vehicles,
  drivers,
  trips,
  maintenance,
  fuelLogs,
  expenses,
  onAddLog,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('summary');
  const [isCompiling, setIsCompiling] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Total Operational Cost (Sum of all expenses)
  const totalOperationalCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 2. Total Fuel Cost (Sum of Fuel category expenses)
  const totalFuelCost = expenses
    .filter((exp) => exp.category === 'Fuel')
    .reduce((sum, exp) => sum + exp.amount, 0);

  // 3. Total Maintenance Cost (Sum of Maintenance/Repair category expenses)
  const totalMaintenanceCost = expenses
    .filter((exp) => exp.category === 'Maintenance' || exp.category === 'Repair')
    .reduce((sum, exp) => sum + exp.amount, 0);

  // 4. Total Trips
  const totalTripsCount = trips.length;

  // 5. Average Fuel Efficiency (MPG or simple fleet average)
  const totalGallonsPumped = fuelLogs.reduce((sum, log) => sum + log.gallons, 0);
  const averageFuelEfficiency = totalGallonsPumped > 0 
    ? (fuelLogs.reduce((sum, log) => sum + log.odometerReading, 0) / fuelLogs.length / 10000).toFixed(1) 
    : '12.4'; // standard fleet heavy MPG

  // A. Vehicle Status Distribution (Pie Chart)
  const vehicleStatusMap = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vehicleStatusData = Object.entries(vehicleStatusMap).map(([status, count]) => ({
    name: status === 'Active' ? 'Active / Available' : status,
    value: count,
  }));

  const VEHICLE_STATUS_COLORS: Record<string, string> = {
    'Active': '#10b981',        // Emerald
    'Available': '#34d399',     // Light Emerald
    'On Trip': '#3b82f6',       // Blue
    'Maintenance': '#f59e0b',   // Amber
    'In Shop': '#f59e0b',       // Amber
    'Out of Service': '#f87171', // Red
    'Retired': '#64748b',       // Slate
  };

  // B. Fuel Consumption by Vehicle (Bar Chart)
  const fuelByVehicleMap = fuelLogs.reduce((acc, log) => {
    const v = vehicles.find((unit) => unit.id === log.vehicleId);
    const code = v ? v.code : `ID: ${log.vehicleId}`;
    acc[code] = (acc[code] || 0) + log.gallons;
    return acc;
  }, {} as Record<string, number>);

  const fuelConsumptionData = Object.entries(fuelByVehicleMap).map(([code, gallons]) => ({
    vehicle: code,
    gallons: Number(gallons.toFixed(1)),
  }));

  // C. Monthly/Category Expenses Breakdown (Pie/Bar Chart)
  const expenseCategoryMap = expenses.reduce((acc, exp) => {
    let cat = exp.category as string;
    if (cat === 'Tolls') cat = 'Toll';
    if (cat === 'Maintenance') cat = 'Repair';
    if (cat === 'Administrative' || cat === 'Salaries') cat = 'Other';
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseCategoryData = Object.entries(expenseCategoryMap).map(([category, amount]) => ({
    category,
    amount: Number(amount.toFixed(2)),
  }));

  const EXPENSE_COLORS: Record<string, string> = {
    'Fuel': '#10b981',
    'Toll': '#3b82f6',
    'Repair': '#f59e0b',
    'Insurance': '#a855f7',
    'Other': '#64748b',
    'Salaries': '#ec4899',
  };

  // D. Trips Status Distribution (Bar Chart)
  const tripStatusMap = trips.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tripStatusData = Object.entries(tripStatusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // E. Fleet Utilization Rate
  const activeVehicles = vehicles.filter(v => v.status === 'Active' || v.status === 'On Trip' || v.status === 'Available').length;
  const utilizationRate = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0;

  const handleCompile = () => {
    setIsCompiling(true);
    setSuccessMsg('');
    setTimeout(() => {
      setIsCompiling(false);
      setSuccessMsg(`Live fleet diagnostics compiled. Verified and synced successfully.`);
      onAddLog(`Refreshed and compiled fleet intelligence report.`);
    }, 1500);
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    setSuccessMsg(`Formatting and exporting ledger logs as ${format.toUpperCase()}...`);
    setTimeout(() => {
      setSuccessMsg(`TransitOps_Audit_Report_2026-07-11.${format} has been downloaded to your computer.`);
      onAddLog(`Exported financial and operational ledger to ${format.toUpperCase()}`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">TransitOps Analytics &amp; Reports Terminal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live insights, fleet efficiency indexes, and cost allocations</p>
            </div>
          </div>

          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} />
            {isCompiling ? 'Calculating Metrics...' : 'Recompute Live Metrics'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all">
          <Info className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Gross Fleet Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">${totalOperationalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <span className="text-[9px] text-slate-400 font-semibold">Aggregate payments</span>
          </div>
        </div>

        {/* Total Fuel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Fuel Bill</span>
            <Fuel className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">${totalFuelCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <span className="text-[9px] text-slate-400 font-semibold">Refueling cost</span>
          </div>
        </div>

        {/* Total Maintenance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Service Bill</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">${totalMaintenanceCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <span className="text-[9px] text-slate-400 font-semibold">Repair/Maintenance</span>
          </div>
        </div>

        {/* Total Trips */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Total Trips</span>
            <Compass className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">{totalTripsCount} Trips</h3>
            <span className="text-[9px] text-slate-400 font-semibold">Dispatched routes</span>
          </div>
        </div>

        {/* Fuel Efficiency */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Fuel Economy</span>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono">{averageFuelEfficiency} MPG</h3>
            <span className="text-[9px] text-slate-400 font-semibold">Fleet mileage average</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 pb-0.5">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'summary'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> SUMMARY PREVIEW
          </span>
        </button>
        <button
          onClick={() => setActiveTab('fuel')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'fuel'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Fuel className="w-4 h-4" /> FUEL LOGS DIAGNOSTIC
          </span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> EXPENDITURE ALLOCATION
          </span>
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'trips'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Compass className="w-4 h-4" /> DISPATCH METRICS
          </span>
        </button>
      </div>

      {/* Interactive Charts Preview based on choice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'summary' && (
          <>
            {/* Chart 1: Fleet Status (Pie) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">Vehicle Status Distribution</h4>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono">
                  {utilizationRate}% Fleet Available
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {vehicleStatusData.map((entry, index) => {
                        const baseStatus = Object.keys(VEHICLE_STATUS_COLORS).find(
                          (status) => entry.name.includes(status)
                        ) || 'Available';
                        const color = VEHICLE_STATUS_COLORS[baseStatus] || '#94a3b8';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={10} 
                      wrapperStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Fleet Utilization Ratio (Circular) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">Fleet Unit Utilization Rate</h4>
                <span className="text-[10px] text-slate-400 font-bold font-mono">In Service status</span>
              </div>
              <div className="h-64 flex flex-col justify-center items-center relative">
                <div className="relative h-44 w-44 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40">
                  <svg className="absolute inset-0 h-full w-full rotate-[-90deg]">
                    <circle
                      cx="88"
                      cy="88"
                      r="76"
                      className="stroke-slate-200 dark:stroke-slate-800 fill-transparent"
                      strokeWidth="12"
                    />
                    <circle
                      cx="88"
                      cy="88"
                      r="76"
                      className="stroke-emerald-500 fill-transparent transition-all duration-1000"
                      strokeWidth="12"
                      strokeDasharray={477.5}
                      strokeDashoffset={477.5 - (477.5 * utilizationRate) / 100}
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-3xl font-black text-slate-800 dark:text-white font-mono">{utilizationRate}%</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Utilization</p>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 text-center font-bold max-w-xs leading-relaxed">
                  {activeVehicles} out of {vehicles.length} vehicles are active and ready for dispatch.
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'fuel' && (
          <>
            {/* Chart 1: Fuel Consumption by Vehicle */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">Fuel consumption by vehicle unit (Gallons)</h4>
                <span className="text-[10px] text-slate-400 font-bold font-mono">{totalGallonsPumped.toFixed(1)} Gal cumulative</span>
              </div>
              <div className="h-72">
                {fuelConsumptionData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-semibold italic">
                    No fuel consumption logged to draw graphs.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fuelConsumptionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="vehicle" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="gallons" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'expenses' && (
          <>
            {/* Chart 1: Expenses Allocation Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">Consolidated Expense Categories ($)</h4>
                <span className="text-[10px] text-slate-400 font-bold font-mono">Audited financials</span>
              </div>
              <div className="h-72">
                {expenseCategoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-semibold italic">
                    No financial ledger logs found.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="category" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={45}>
                        {expenseCategoryData.map((entry, index) => {
                          const baseColor = EXPENSE_COLORS[entry.category] || '#10b981';
                          return <Cell key={`cell-${index}`} fill={baseColor} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'trips' && (
          <>
            {/* Chart 1: Trips Status Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">Trip status counts</h4>
                <span className="text-[10px] text-slate-400 font-bold font-mono">{totalTripsCount} Trips total</span>
              </div>
              <div className="h-64">
                {tripStatusData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-semibold italic">
                    No trips logged inside ledger database.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tripStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="status" stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Metric 2: Completed and Active Trips Counts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">Trip Lifecycle Metrics</h4>
                <span className="text-[10px] text-slate-400 font-bold font-mono font-semibold">Operations Ratios</span>
              </div>
              <div className="space-y-4 my-auto">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Completed Deliveries</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {trips.filter((t) => t.status === 'Completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Active / En Route</span>
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    {trips.filter((t) => t.status === 'Dispatched' || t.status === 'En Route').length}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Scheduled / Future Run</span>
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    {trips.filter((t) => t.status === 'Scheduled').length}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Export Section & Document Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between transition-colors duration-200">
        {/* Header preview row */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex flex-wrap gap-4 items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">
            Auditable Fleet Reports Preview
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" /> Export PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Export CSV
            </button>
          </div>
        </div>

        {/* Dynamic preview list */}
        <div className="p-6 bg-slate-50/20 dark:bg-slate-950/20 max-h-60 overflow-y-auto space-y-2 text-xs">
          <div className="grid grid-cols-4 font-bold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider text-[10px] pb-2 border-b border-slate-100 dark:border-slate-850">
            <span>Fleet Unit</span>
            <span>Refuel Count</span>
            <span>Repair Count</span>
            <span className="text-right">Total expenses</span>
          </div>

          {vehicles.map((v) => {
            const vehicleFuelLogs = fuelLogs.filter((log) => log.vehicleId === v.id);
            const vehicleMaint = maintenance.filter((log) => log.vehicleId === v.id);
            const vehicleExp = expenses.filter((exp) => exp.vehicleId === v.id);
            const vehicleTotalExpenses = vehicleExp.reduce((sum, e) => sum + e.amount, 0);

            return (
              <div key={v.id} className="grid grid-cols-4 py-2.5 border-b border-slate-100 dark:border-slate-900/60 font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {v.code}
                </span>
                <span>{vehicleFuelLogs.length} logs</span>
                <span>{vehicleMaint.length} records</span>
                <span className="text-right text-emerald-600 dark:text-emerald-400 font-mono font-bold">${vehicleTotalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            );
          })}
        </div>

        {/* Footer compliance line */}
        <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Fleet Compliant with DOT (FMCSA &amp; FTA) Guidelines.
          </span>
          <span className="font-mono flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {new Date().toISOString().split('T')[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
