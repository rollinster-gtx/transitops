/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  ShieldAlert,
  User,
  Clock,
  CheckCheck,
  CircleDot,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { Role, AppTab, SystemNotification } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  userRole: Role;
  userName: string;
  userEmail: string;
  onRoleChange: (role: Role) => void;
  onLogout: () => void;
  onMenuToggle: () => void;
  notifications: SystemNotification[];
  onMarkNotificationsRead: () => void;
  onOpenSearch: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export default function Header({
  activeTab,
  userRole,
  userName,
  userEmail,
  onRoleChange,
  onLogout,
  onMenuToggle,
  notifications,
  onMarkNotificationsRead,
  onOpenSearch,
  theme,
  onThemeToggle,
}: HeaderProps) {
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showNotificationTray, setShowNotificationTray] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const formatTabName = (tab: AppTab) => {
    if (tab === 'rbac') return 'Role Based Access Control (RBAC)';
    if (tab === 'fuel') return 'Fuel Logs';
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md px-6 shadow-sm transition-colors duration-200">
      {/* Title & Navigation Trigger */}
      <div className="flex items-center gap-4">
        <button
          id="menu-toggle-btn"
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-sans tracking-tight">
            {formatTabName(activeTab)}
          </h2>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-emerald-500" />
            <span>Terminal: 2026-07-11 UTC MST</span>
          </div>
        </div>
      </div>

      {/* Control Actions / Status Bar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        
        {/* Modern Interactive Global Search input mockup */}
        <button
          id="trigger-global-search"
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 w-48 lg:w-64 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-400 dark:text-slate-500 text-left transition-all cursor-pointer outline-none"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 truncate">Search everything...</span>
          <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-400">⌘K</span>
        </button>

        {/* Search icon triggers search modal directly on small screens */}
        <button
          id="trigger-global-search-mobile"
          onClick={onOpenSearch}
          className="md:hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Interactive Quick Role Switcher for Evaluation */}
        <div className="relative">
          <button
            id="quick-role-switcher"
            onClick={() => {
              setShowRoleSelector(!showRoleSelector);
              setShowNotificationTray(false);
              setShowProfileMenu(false);
            }}
            className="flex items-center gap-1 sm:gap-2 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 px-2.5 sm:px-3.5 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer focus:outline-none"
          >
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline">Quick Context:</span>
            <span className="font-extrabold underline uppercase">{userRole}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>

          {showRoleSelector && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Switch Security Context
              </div>
              <hr className="my-1 border-slate-100 dark:border-slate-800" />
              {(['admin', 'dispatcher', 'maintenance', 'viewer'] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onRoleChange(role);
                    setShowRoleSelector(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition-colors ${
                    userRole === role
                      ? 'bg-emerald-500 text-slate-900'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="capitalize">{role} Mode</span>
                  {userRole === role && <CircleDot className="h-3 w-3 shrink-0 text-slate-900" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Theme Changer Button */}
        <button
          id="theme-switcher-btn"
          onClick={onThemeToggle}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            id="notifications-tray-btn"
            onClick={() => {
              setShowNotificationTray(!showNotificationTray);
              setShowRoleSelector(false);
              setShowProfileMenu(false);
            }}
            className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            )}
          </button>

          {showNotificationTray && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in duration-150">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkNotificationsRead();
                      setShowNotificationTray(false);
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold italic">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 transition-colors ${n.read ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-slate-800/40'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mt-1.5 mr-2 shrink-0 ${
                            n.type === 'danger'
                              ? 'bg-rose-500'
                              : n.type === 'warning'
                                ? 'bg-amber-500'
                                : n.type === 'success'
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{n.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block font-mono font-bold">
                            {new Date(n.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            id="user-profile-menu"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowRoleSelector(false);
              setShowNotificationTray(false);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer focus:outline-none"
          >
            <div className="h-7 w-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-xs uppercase shadow-sm">
              {userName.slice(0, 2)}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300 max-w-24 truncate">
              {userName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in duration-150">
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{userEmail}</p>
              </div>
              <hr className="my-1 border-slate-100 dark:border-slate-800" />
              <div className="px-3 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">
                Clearance: <span className="text-emerald-500 dark:text-emerald-400">{userRole}</span>
              </div>
              <hr className="my-1 border-slate-100 dark:border-slate-800" />
              <button
                id="logout-btn"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
