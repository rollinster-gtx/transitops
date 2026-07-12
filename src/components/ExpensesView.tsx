/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  Plus,
  Search,
  Lock,
  X,
  CreditCard,
  PieChart,
  Tag,
  Calendar,
  Truck,
} from 'lucide-react';
import { Expense, Vehicle, Permission } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  vehicles: Vehicle[];
  onAddExpense: (expense: Omit<Expense, 'id'> & { vehicleId?: string }) => void;
  permissions: Permission[];
}

export default function ExpensesView({
  expenses,
  vehicles,
  onAddExpense,
  permissions,
}: ExpensesViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');

  // Form states
  const [category, setCategory] = useState<Expense['category']>('Fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const canCreate = permissions.includes('create');

  // Complete category pool
  const categories: Expense['category'][] = [
    'Fuel',
    'Toll',
    'Repair',
    'Insurance',
    'Other',
    'Maintenance',
    'Tolls',
    'Salaries',
    'Administrative',
  ];

  // User visible selection categories
  const inputCategories = ['Fuel', 'Toll', 'Repair', 'Insurance', 'Other'];

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.referenceId && e.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Map categories in filter for flexibility
    const matchesCategory =
      categoryFilter === 'All' ||
      e.category === categoryFilter ||
      (categoryFilter === 'Toll' && e.category === 'Tolls') ||
      (categoryFilter === 'Repair' && e.category === 'Maintenance') ||
      (categoryFilter === 'Other' && (e.category === 'Administrative' || e.category === 'Salaries'));

    const matchesVehicle =
      vehicleFilter === 'All' || e.vehicleId === vehicleFilter;

    return matchesSearch && matchesCategory && matchesVehicle;
  });

  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Calculate percentages by simplified categories for visual breakdown
  const simplifiedCategories = ['Fuel', 'Toll', 'Repair', 'Insurance', 'Other'];
  const categoryStats = simplifiedCategories.map((cat) => {
    const sum = expenses.reduce((acc, e) => {
      let isMatch = false;
      if (cat === 'Fuel' && e.category === 'Fuel') isMatch = true;
      if (cat === 'Toll' && (e.category === 'Toll' || e.category === 'Tolls')) isMatch = true;
      if (cat === 'Repair' && (e.category === 'Repair' || e.category === 'Maintenance')) isMatch = true;
      if (cat === 'Insurance' && e.category === 'Insurance') isMatch = true;
      if (cat === 'Other' && (e.category === 'Other' || e.category === 'Administrative' || e.category === 'Salaries')) isMatch = true;
      
      return isMatch ? acc + e.amount : acc;
    }, 0);

    const totalAll = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      name: cat,
      amount: sum,
      pct: totalAll > 0 ? (sum / totalAll) * 100 : 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onAddExpense({
      category,
      description,
      amount: Number(amount),
      date: expenseDate || new Date().toISOString().split('T')[0],
      vehicleId: selectedVehicleId || undefined,
    });

    setDescription('');
    setSelectedVehicleId('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview financial blocks and dynamic category percentages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core numbers (Col: 1) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-44">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
                Fleet Expense Balance
              </span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                * Based on the filtered view of {filteredExpenses.length} ledger logs.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-xs text-slate-400 space-y-2">
            <div className="font-bold text-white uppercase tracking-wider font-mono text-[10px] pb-1 border-b border-slate-800">
              Audit Compliance Status
            </div>
            <p className="leading-relaxed font-semibold">
              All listed entries are generated in offline simulation and matched with refueling/maintenance references.
            </p>
          </div>
        </div>

        {/* Categories break-down progress lines (Col: 2) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4.5 h-4.5 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Category Allocation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {categoryStats.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="text-slate-400 font-mono">
                    ${item.amount.toLocaleString()} ({item.pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className={`h-full rounded-full ${
                      item.name === 'Fuel'
                        ? 'bg-emerald-500'
                        : item.name === 'Repair'
                          ? 'bg-amber-500'
                          : item.name === 'Toll'
                            ? 'bg-indigo-500'
                            : item.name === 'Insurance'
                              ? 'bg-purple-500'
                              : 'bg-slate-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Trigger */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search description, reference logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-300 py-2.5 px-3 focus:border-emerald-500 focus:outline-none cursor-pointer font-semibold"
          >
            <option value="All">All Expense Types</option>
            {simplifiedCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-300 py-2.5 px-3 focus:border-emerald-500 focus:outline-none cursor-pointer font-semibold"
          >
            <option value="All">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.code}
              </option>
            ))}
          </select>

          {canCreate ? (
            <button
              onClick={() => {
                setSelectedVehicleId('');
                setShowAddForm(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Expense
            </button>
          ) : (
            <div
              className="flex items-center gap-2 rounded-xl bg-slate-800 text-slate-500 font-semibold text-xs px-4 py-2.5 border border-slate-700/60 cursor-not-allowed"
              title="Restricted by RBAC rules"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Log Expense (Locked)
            </div>
          )}
        </div>
      </div>

      {/* Expenses Ledger list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Vehicle</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Description</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Reference Code</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-500 font-semibold">
                    No expenditures logged.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  // Normalize legacy categories for display
                  let displayCategory = exp.category;
                  if (exp.category === 'Tolls') displayCategory = 'Toll';
                  if (exp.category === 'Maintenance') displayCategory = 'Repair';
                  if (exp.category === 'Administrative' || exp.category === 'Salaries') displayCategory = 'Other';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-850/20 transition-colors text-xs font-semibold text-slate-300">
                      <td className="px-6 py-4 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{exp.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-white">{displayCategory}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {exp.vehicleId ? (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Truck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{vehicles.find((v) => v.id === exp.vehicleId)?.code || 'Unknown'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic font-normal">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-normal text-slate-400">{exp.description}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 uppercase text-[10px]">
                        {exp.referenceId ? exp.referenceId : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-mono font-bold">${exp.amount.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Log Operational Expense
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
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Expense Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {inputCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Vehicle Unit</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">None / Fleet-wide</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.code} - {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Charge Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E-ZPass toll refills for Bus 101"
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Register Cost Record
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
