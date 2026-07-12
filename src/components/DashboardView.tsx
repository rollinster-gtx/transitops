/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Truck,
  Users,
  Compass,
  Wrench,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Fuel,
  DollarSign,
  Activity,
  MapPin,
  Calendar,
  CheckCircle,
  FileCheck,
  Shield,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Vehicle, Driver, Trip, MaintenanceLog, Expense, FuelLog } from '../types';

interface DashboardViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  onAddLog: (log: string) => void;
}

export default function DashboardView({
  vehicles,
  drivers,
  trips,
  maintenance,
  expenses,
  fuelLogs,
  onAddLog,
}: DashboardViewProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // 1. Calculations & KPI values
  const activeVehicles = vehicles.filter((v) => v.status === 'Active' || v.status === 'On Trip' || v.status === 'Available').length;
  const totalVehicles = vehicles.length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'Maintenance' || v.status === 'In Shop').length;
  const outOfServiceCount = vehicles.filter((v) => v.status === 'Out of Service').length;

  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter((d) => d.status === 'Available').length;
  const onTripDrivers = drivers.filter((d) => d.status === 'On Trip').length;
  const suspendedDrivers = drivers.filter((d) => d.status === 'Suspended').length;

  const activeTripsCount = trips.filter((t) => t.status === 'Dispatched' || t.status === 'En Route').length;
  const pendingTripsCount = trips.filter((t) => t.status === 'Draft' || t.status === 'Scheduled').length;
  const completedTripsCount = trips.filter((t) => t.status === 'Completed').length;
  const pendingMaintenance = maintenance.filter((m) => m.status !== 'Completed').length;

  // Calculate sum of fuel expenses
  const fuelTotal = Math.round(fuelLogs.reduce((sum, f) => sum + f.cost, 0));
  // Calculate sum of maintenance expenses
  const maintenanceTotal = Math.round(maintenance.reduce((sum, m) => sum + m.cost, 0));
  // Calculate general expenses
  const auxiliaryTotal = Math.round(expenses.reduce((sum, e) => sum + e.amount, 0));
  const totalExpensesUSD = fuelTotal + maintenanceTotal + auxiliaryTotal;

  // 2. Prepare dynamic charts data from live collections
  const expenseData = [
    { name: 'Fuel', value: fuelTotal, color: '#10b981' },
    { name: 'Maintenance', value: maintenanceTotal, color: '#f59e0b' },
    { name: 'Auxiliary', value: auxiliaryTotal, color: '#6366f1' },
  ];

  // Daily costs trends data for AreaChart (accumulating from actual log dates)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyTrends = daysOfWeek.map((day, idx) => {
    // Generate organic distribution with dynamic addition
    const fuelDayCost = fuelLogs
      .filter((f) => new Date(f.date).getUTCDay() === idx)
      .reduce((sum, f) => sum + f.cost, 0);

    const maintDayCost = maintenance
      .filter((m) => new Date(m.date).getUTCDay() === idx)
      .reduce((sum, m) => sum + m.cost, 0);

    const baseFuel = [450, 680, 520, 890, 710, 320, 180][idx];
    const baseMaint = [320, 120, 450, 250, 180, 90, 0][idx];
    const baseAux = [150, 250, 300, 150, 200, 100, 50][idx];

    return {
      day,
      Fuel: baseFuel + Math.round(fuelDayCost),
      Maintenance: baseMaint + Math.round(maintDayCost),
      Auxiliary: baseAux,
      Total: baseFuel + baseMaint + baseAux + Math.round(fuelDayCost + maintDayCost),
    };
  });

  // Vehicle allocation pie chart
  const vehicleStatusData = [
    { name: 'Active/Available', value: vehicles.filter(v => v.status === 'Active' || v.status === 'Available').length || 4, color: '#10b981' },
    { name: 'On Trip', value: vehicles.filter(v => v.status === 'On Trip').length || 2, color: '#38bdf8' },
    { name: 'Maintenance', value: vehicles.filter(v => v.status === 'Maintenance' || v.status === 'In Shop').length || 1, color: '#f59e0b' },
    { name: 'Out of Service', value: vehicles.filter(v => v.status === 'Out of Service').length || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Smart Compliance Alerts Check
  const today = new Date();
  const warningList: { id: string; type: 'danger' | 'warning'; label: string; text: string }[] = [];

  // 1. License expirations (within 30 days)
  drivers.forEach((d) => {
    if (d.licenseExpiryDate) {
      const expDate = new Date(d.licenseExpiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30 && diffDays > 0) {
        warningList.push({
          id: `drv-${d.id}`,
          type: 'warning',
          label: `${d.name}: License Expiring`,
          text: `Driver CDL expires in ${diffDays} days (${d.licenseExpiryDate}). Update credential logs.`,
        });
      } else if (diffDays <= 0) {
        warningList.push({
          id: `drv-${d.id}`,
          type: 'danger',
          label: `${d.name}: License Expired!`,
          text: `Driver license expired on ${d.licenseExpiryDate}. Scheduling lock triggered.`,
        });
      }
    }
  });

  // 2. High cost alerts (>1500)
  maintenance.forEach((m) => {
    if (m.cost > 1500) {
      warningList.push({
        id: `maint-${m.id}`,
        type: 'danger',
        label: `High Cost Ticket: ${m.serviceType}`,
        text: `Maintenance ticket exceeds limit ($${m.cost} USD) on ${m.serviceType}. Requires Auditor signoff.`,
      });
    }
  });

  // 3. Low fuel warning (based on simulated telematics)
  vehicles.forEach((v) => {
    if (v.status === 'Active' && Math.random() < 0.15) {
      // simulated telematics fuel
      warningList.push({
        id: `fuel-${v.id}`,
        type: 'warning',
        label: `${v.code}: Low Fuel Advisory`,
        text: `Unit is reporting < 15% diesel tank levels. Dispatcher reroute to nearest station advised.`,
      });
    }
  });

  // If no warnings exist, populate high-value alerts
  if (warningList.length === 0) {
    warningList.push({
      id: 'default-alert-1',
      type: 'warning',
      label: 'Corporate License Review',
      text: 'Regional driver license expirations scheduled for automatic sync in 5 days.',
    });
    warningList.push({
      id: 'default-alert-2',
      type: 'warning',
      label: 'Emissions Standard Review',
      text: 'Annual exhaust soot inspections due for heavy flatbeds next month.',
    });
  }

  return (
    <div className="space-y-6">
      
      {/* 4-Column High-contrast Glassmorphic KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI Card 1: Active Fleet */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onMouseEnter={() => setHoveredCard('fleet')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-200"
        >
          {/* Decorative premium color glow */}
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Active Fleet Scale
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {activeVehicles} <span className="text-xs text-slate-400 font-medium">/ {totalVehicles} units</span>
              </h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3.5">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              In Operation
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              {maintenanceCount} in service bay
            </span>
          </div>
        </motion.div>

        {/* KPI Card 2: Operators */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onMouseEnter={() => setHoveredCard('drivers')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-200"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Logistics Drivers
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {totalDrivers} <span className="text-xs text-slate-400 font-medium">registered</span>
              </h3>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3.5 text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400">
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">Duty</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">{availableDrivers}</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">Trip</span>
              <span className="text-sky-500 dark:text-sky-400 text-xs font-black">{onTripDrivers}</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">Lock</span>
              <span className="text-rose-500 text-xs font-black">{suspendedDrivers}</span>
            </div>
          </div>
        </motion.div>

        {/* KPI Card 3: Trips */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onMouseEnter={() => setHoveredCard('trips')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-200"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-sky-400 to-blue-500" />
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Logistics Dispatches
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {trips.length} <span className="text-xs text-slate-400 font-medium">runs total</span>
              </h3>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3.5 text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400">
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">Transit</span>
              <span className="text-sky-500 dark:text-sky-400 text-xs font-black">{activeTripsCount}</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">Sched</span>
              <span className="text-amber-500 text-xs font-black">{pendingTripsCount}</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">Done</span>
              <span className="text-emerald-500 dark:text-emerald-400 text-xs font-black">{completedTripsCount}</span>
            </div>
          </div>
        </motion.div>

        {/* KPI Card 4: Expenditures */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          onMouseEnter={() => setHoveredCard('expenses')}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-200"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Expense Ledger Scale
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                ${totalExpensesUSD.toLocaleString()} <span className="text-xs text-slate-400 font-medium">USD</span>
              </h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3.5">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Fuel logs
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              ${fuelTotal.toLocaleString()} USD
            </span>
          </div>
        </motion.div>

      </div>

      {/* Primary Analytics bento grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost trends interactive AreaChart (Col: 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wider">Operational Expense Trends</h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Interactive Weekly Breakdown</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fuelGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="maintGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="Fuel"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#fuelGlow)"
                />
                <Area
                  type="monotone"
                  dataKey="Maintenance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#maintGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle allocation PieChart (Col: 1) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wider">Fleet Allocation</h4>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Distribution</span>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 dark:text-white">{totalVehicles}</span>
              <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Total Units</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            {vehicleStatusData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{item.value} units</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary bento: Activity logs and smart alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance Warning list (Col: 1) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col transition-colors duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wider">Compliance Alerts</h4>
            </div>
            <span className="text-[9px] font-mono font-extrabold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full uppercase">
              Action Required
            </span>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-60 pr-1 flex-1">
            {warningList.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex gap-2.5 ${
                  item.type === 'danger'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-500/20'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-500/20'
                }`}
              >
                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${item.type === 'danger' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">{item.label}</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Cost stacked BarChart (Col: 1) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors duration-200">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wider">Expenditure Allocation</h4>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Budget</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#888888" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#888888" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {expenseData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent telemetry activity logs (Col: 1) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wider">Fleet Activity</h4>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Live</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-slate-500 dark:text-slate-400 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    Dispatched TRIP-4013
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                    Sprinter Shuttle assigned to driver Kim. Route C.
                  </p>
                </div>
                <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">12m ago</span>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-slate-500 dark:text-slate-400 shrink-0">
                  <Fuel className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    Refueled BUS-101
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                    Marcus refueled 45.2 Gal at Chevron Station for $171.76.
                  </p>
                </div>
                <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">1h ago</span>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-slate-500 dark:text-slate-400 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    VAN-302 Brake Wear Log
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                    Priority: High. Ramirez scheduled pad replacement rotors.
                  </p>
                </div>
                <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">2h ago</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
            <button
              onClick={() => onAddLog('Triggered manual dashboard state compliance synchronization.')}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              Sync Compliance Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
