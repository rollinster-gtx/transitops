/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Save,
  Lock,
  Info,
  Bell,
  Shield,
  Phone,
  Clock,
  Building2,
  User,
  Key,
  Palette,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Permission } from '../types';

interface SettingsViewProps {
  permissions: Permission[];
  onAddLog: (log: string) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

type SettingsSection = 'company' | 'profile' | 'password' | 'notifications' | 'theme';

export default function SettingsView({
  permissions,
  onAddLog,
  theme,
  onThemeChange,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('company');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Company Profile
  const [orgName, setOrgName] = useState('Metro Transit Systems Corp');
  const [contactPhone, setContactPhone] = useState('+1 (555) 019-9000');
  const [timezone, setTimezone] = useState('Central Standard Time (CST)');
  const [address, setAddress] = useState('742 Logistics Blvd, Suite 100, Metro City, MC 94012');
  const [regNumber, setRegNumber] = useState('USDOT-391055-MT');

  // 2. User Profile
  const [fullName, setFullName] = useState('Lead Dispatcher');
  const [userEmail, setUserEmail] = useState('dispatcher@transitops.io');
  const [userPhone, setUserPhone] = useState('+1 (555) 123-4567');
  const [department, setDepartment] = useState('Fleet Operations');

  // 3. Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 4. Notification Settings
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [fuelNotificationThreshold, setFuelNotificationThreshold] = useState(15);
  const [alertOnMaintenance, setAlertOnMaintenance] = useState(true);
  const [alertOnTripCompleted, setAlertOnTripCompleted] = useState(true);
  const [alertOnHighExpenses, setAlertOnHighExpenses] = useState(true);

  // 5. Theme / Accent Color Settings
  const [accentColor, setAccentColor] = useState<'emerald' | 'indigo' | 'sky' | 'rose'>('emerald');

  const canEdit = permissions.includes('edit');

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    triggerToast('Company profile parameters saved.');
    onAddLog(`Modified organizational metadata for ${orgName}.`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    triggerToast('User profile settings updated.');
    onAddLog('Modified dispatcher profile fields.');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!currentPassword) {
      triggerToast('Current password is required.', true);
      return;
    }
    if (newPassword.length < 6) {
      triggerToast('New password must be at least 6 characters long.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('New passwords do not match.', true);
      return;
    }

    triggerToast('Password changed successfully.');
    onAddLog('Changed account credentials.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    triggerToast('Notification preferences successfully saved.');
    onAddLog('Modified threshold trigger alerts.');
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, text: 'None', color: 'bg-slate-700' };
    if (newPassword.length < 5) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (newPassword.length < 8) return { score: 2, text: 'Fair', color: 'bg-amber-500' };
    return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Settings Header banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">TransitOps Enterprise Core Settings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure corporate standards, account credentials, and layout modes</p>
          </div>
        </div>
      </div>

      {/* RBAC notice */}
      {!canEdit && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-600/30 rounded-2xl p-4 text-amber-800 dark:text-amber-200 text-xs flex gap-2 items-center font-semibold animate-pulse">
          <Info className="w-4.5 h-4.5 text-amber-500 shrink-0" />
          <span>
            <strong>Read-Only Restriction:</strong> Impersonating security context without write permissions. Select <strong>Admin</strong> from Quick Switcher to unlock modifications.
          </span>
        </div>
      )}

      {/* Dynamic Status messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-bold"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 font-bold"
          >
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Tabs (Vertical List) */}
        <div className="space-y-1 md:col-span-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Settings Sections
          </div>
          <button
            onClick={() => setActiveSection('company')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'company'
                ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company Profile</span>
          </button>
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>User Profile</span>
          </button>
          <button
            onClick={() => setActiveSection('password')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'password'
                ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'notifications'
                ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveSection('theme')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'theme'
                ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme &amp; Style</span>
          </button>
        </div>

        {/* Configurations Forms (Col-span: 3) */}
        <div className="md:col-span-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[400px] transition-colors duration-200">
            
            {/* Tab content 1: Company Settings */}
            {activeSection === 'company' && (
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white font-sans">Company Information</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Corporate details used in generated financial audit logs</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Organization Name *</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">USDOT Registry ID *</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      required
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Dispatcher Hotline *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        disabled={!canEdit}
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full pl-9 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Operations Timezone</label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                      <select
                        disabled={!canEdit}
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full pl-9 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        <option value="Central Standard Time (CST)">Central Standard Time (CST)</option>
                        <option value="Mountain Standard Time (MST)">Mountain Standard Time (MST)</option>
                        <option value="Pacific Standard Time (PST)">Pacific Standard Time (PST)</option>
                        <option value="Eastern Standard Time (EST)">Eastern Standard Time (EST)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Headquarters Location Address</label>
                  <textarea
                    disabled={!canEdit}
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50"
                  />
                </div>
                {canEdit && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Company Details
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Tab content 2: User Settings */}
            {activeSection === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white font-sans">User Settings</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Configure personal information and platform details</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl mb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-sm uppercase">
                    {fullName.slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{fullName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-semibold uppercase">{department}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Full Name *</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Account Email *</label>
                    <input
                      type="email"
                      disabled={!canEdit}
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Direct Phone Number</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Department</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Profile Info
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Tab content 3: Password settings */}
            {activeSection === 'password' && (
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white font-sans">Credential Management</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Update account passwords to comply with corporate security standards</p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={!canEdit}
                        required={newPassword.length > 0}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 pr-10 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">New Secure Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={!canEdit}
                      required={currentPassword.length > 0}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 font-mono"
                    />
                    
                    {/* Secure password strength indicator */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-mono">
                          <span>Strength:</span>
                          <span className="uppercase text-emerald-500">{getPasswordStrength().text}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(getPasswordStrength().score / 3) * 100}%` }}
                            className={`h-full transition-all duration-300 ${getPasswordStrength().color}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 font-mono">Confirm New Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={!canEdit}
                      required={currentPassword.length > 0}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2.5 focus:border-emerald-500 focus:outline-none font-semibold disabled:opacity-50 font-mono"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save New Credentials
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Tab content 4: Notifications settings */}
            {activeSection === 'notifications' && (
              <form onSubmit={handleSaveNotifications} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white font-sans">Notification Guidelines</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Configure real-time threshold levels and tray alert groups</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white block">System Alerts Tray</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Display live active field notifications.</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={enableAlerts}
                      onChange={(e) => setEnableAlerts(e.target.checked)}
                      className="h-4.5 w-4.5 text-emerald-500 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">Low Fuel Level Notification Slider</span>
                      <span className="font-mono text-emerald-500 font-extrabold">{fuelNotificationThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      disabled={!canEdit}
                      min="5"
                      max="35"
                      step="5"
                      value={fuelNotificationThreshold}
                      onChange={(e) => setFuelNotificationThreshold(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                    />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-relaxed">
                      Triggers active warning logs when a vehicle unit reports fuel levels lower than this limit.
                    </span>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block">Log Alert Subscriptions</span>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">License Expiry &amp; Maintenance Due Alerts</span>
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={alertOnMaintenance}
                        onChange={(e) => setAlertOnMaintenance(e.target.checked)}
                        className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Trip Dispatched / Completed Telemetry</span>
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={alertOnTripCompleted}
                        onChange={(e) => setAlertOnTripCompleted(e.target.checked)}
                        className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">High Expenditure Notifications (&gt;$1,500)</span>
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={alertOnHighExpenses}
                        onChange={(e) => setAlertOnHighExpenses(e.target.checked)}
                        className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Notification Preferences
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Tab content 5: Theme settings */}
            {activeSection === 'theme' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white font-sans">Theme &amp; Stylings</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Configure visual themes, palettes, and layout aesthetics</p>
                </div>

                <div className="space-y-4">
                  {/* Theme toggler buttons */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block mb-2">Display Theme Mode</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => onThemeChange('light')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <Palette className="w-5 h-5 text-amber-500" />
                        <span className="text-xs">Responsive Light Mode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onThemeChange('dark')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs">Responsive Dark Mode</span>
                      </button>
                    </div>
                  </div>

                  {/* Accent select */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono block mb-2">Primary Accent Tone</span>
                    <div className="flex gap-3">
                      {(['emerald', 'indigo', 'sky', 'rose'] as const).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setAccentColor(color)}
                          className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            accentColor === color
                              ? 'border-slate-900 dark:border-white scale-110 shadow-sm'
                              : 'border-transparent'
                          }`}
                        >
                          <span
                            className={`h-6 w-6 rounded-lg ${
                              color === 'emerald'
                                ? 'bg-emerald-500'
                                : color === 'indigo'
                                  ? 'bg-indigo-500'
                                  : color === 'sky'
                                    ? 'bg-sky-500'
                                    : 'bg-rose-500'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
                  Tip: Theme toggles apply globally to all viewcards instantly. TransitOps defaults to responsive OLED slate levels to save device monitor workloads.
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
