/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Users,
  Compass,
  Wrench,
  Fuel,
  DollarSign,
  BarChart3,
  Settings,
  ShieldAlert,
  Lock,
  Menu,
} from 'lucide-react';
import { AppTab, Role, Permission } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  userRole: Role;
  permissionsMap: Record<AppTab, Permission[]>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  userRole,
  permissionsMap,
  isOpen,
  setIsOpen,
}: SidebarProps) {
  // Mapping of tab to display names, icons and description
  const menuItems: { id: AppTab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'trips', label: 'Trips', icon: Compass },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'fuel', label: 'Fuel Logs', icon: Fuel },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'rbac', label: 'Role Control', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Helper to check if a tab is allowed
  const hasAccess = (tab: AppTab) => {
    const perms = permissionsMap[tab] || [];
    return perms.includes('view');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm lg:hidden transition-all duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-md shadow-emerald-500/10">
              <Truck className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-wide font-sans">TransitOps</h1>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold tracking-widest uppercase">
                Fleet Engine
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white lg:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
            Navigation
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isAccessible = hasAccess(item.id);
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  // Close on mobile
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-slate-950' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {/* Locked indicators for visual feedback on RBAC */}
                {!isAccessible && (
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md ${
                      isActive ? 'bg-slate-950/10 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-amber-500'
                    }`}
                    title="Restricted View (Click to inspect limits)"
                  >
                    <Lock className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Role Indicator Card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border border-slate-200 dark:border-slate-750">
                  {userRole.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {userRole === 'admin'
                    ? 'Admin Suite'
                    : userRole === 'dispatcher'
                      ? 'Dispatcher'
                      : userRole === 'maintenance'
                        ? 'Maintenance Eng'
                        : 'Viewer Guest'}
                </p>
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 uppercase tracking-widest mt-1">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
