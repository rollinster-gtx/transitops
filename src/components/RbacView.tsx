/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ShieldAlert, Users, Check, X, UserPlus, Info, RotateCcw } from 'lucide-react';
import { Role, AppTab, Permission, TeamMember, RolePermissionsMap } from '../types';

interface RbacViewProps {
  permissions: RolePermissionsMap;
  onChangePermission: (role: Role, tab: AppTab, permission: Permission, value: boolean) => void;
  onResetPermissions: () => void;
  teamMembers: TeamMember[];
  onAddTeamMember: (name: string, email: string, role: Role) => void;
  onChangeTeamMemberRole: (id: string, role: Role) => void;
  canEdit: boolean;
}

export default function RbacView({
  permissions,
  onChangePermission,
  onResetPermissions,
  teamMembers,
  onAddTeamMember,
  onChangeTeamMemberRole,
  canEdit,
}: RbacViewProps) {
  const [selectedRole, setSelectedRole] = useState<Role>('dispatcher');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('viewer');
  const [showAddUser, setShowAddUser] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const modules: { id: AppTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard Module' },
    { id: 'vehicles', label: 'Vehicles Fleet' },
    { id: 'drivers', label: 'Drivers Registry' },
    { id: 'trips', label: 'Trips & Dispatch' },
    { id: 'maintenance', label: 'Maintenance Log' },
    { id: 'fuel', label: 'Fuel Logs' },
    { id: 'expenses', label: 'Expenses Ledger' },
    { id: 'reports', label: 'Analytical Reports' },
    { id: 'rbac', label: 'Role Control (RBAC)' },
    { id: 'settings', label: 'System Settings' },
  ];

  const permissionTypes: { id: Permission; label: string }[] = [
    { id: 'view', label: 'Read/View' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit/Update' },
    { id: 'delete', label: 'Delete' },
  ];

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    onAddTeamMember(newUserName, newUserEmail, newUserRole);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('viewer');
    setShowAddUser(false);
    setSuccessMsg('New operator added successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Informational banner */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-white">How to evaluate RBAC:</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Configure permissions in the matrix below for any role, then use the 
            <strong className="text-emerald-400 font-mono"> Quick Role Switcher</strong> in the top header to 
            instantly impersonate that role. You will see locked icons appear in the sidebar, 
            editing features disabled, and modules adapt to security restrictions immediately in real-time.
          </p>
        </div>
      </div>

      {!canEdit && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3 text-amber-200 text-xs flex gap-2 items-center">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            <strong>Read-Only Mode:</strong> Your current session role does not have authorization to modify security policies. Impersonate <strong className="underline">Admin</strong> in the header switcher to make adjustments.
          </span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500 text-emerald-200 text-xs px-4 py-2 rounded-lg">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permission matrix */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-slate-950/20">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Security Matrix</h3>
                <p className="text-[11px] text-slate-500 font-medium">Toggle capabilities for each client group</p>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={onResetPermissions}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
              </button>
            )}
          </div>

          {/* Role selector tabs inside Matrix */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-1.5">
            {(['admin', 'dispatcher', 'maintenance', 'viewer'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedRole === r
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="capitalize">{r}</span>
              </button>
            ))}
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Module / Section</th>
                  {permissionTypes.map((pt) => (
                    <th key={pt.id} className="px-4 py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      {pt.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {modules.map((m) => {
                  const hasView = (permissions[selectedRole][m.id] || []).includes('view');

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-200">{m.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">/src/tabs/{m.id}</div>
                      </td>
                      {permissionTypes.map((pt) => {
                        const isGranted = (permissions[selectedRole][m.id] || []).includes(pt.id);
                        // view is required to check others
                        const isLocked = pt.id !== 'view' && !hasView;

                        return (
                          <td key={pt.id} className="px-4 py-4 text-center">
                            <button
                              disabled={!canEdit || isLocked || (selectedRole === 'admin' && m.id === 'rbac')} // restrict editing admin rbac to prevent deadlock
                              onClick={() => onChangePermission(selectedRole, m.id, pt.id, !isGranted)}
                              className={`mx-auto h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
                                isLocked
                                  ? 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed'
                                  : isGranted
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer'
                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800 cursor-pointer'
                              } ${!canEdit ? 'cursor-not-allowed opacity-80' : ''}`}
                              title={isLocked ? 'Must grant View first' : `${pt.label} permission`}
                            >
                              {isGranted && !isLocked ? (
                                <Check className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team roster and roles adjustment */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Operator Registry</h3>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="p-1.5 rounded-lg text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800 hover:border-emerald-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            {showAddUser && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddUserSubmit}
                className="mb-6 p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3"
              >
                <h4 className="text-xs font-bold text-slate-300">Add New Operator</h4>
                <div>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full text-xs rounded-lg border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500 p-2.5 focus:border-emerald-500 focus:outline-none border"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full text-xs rounded-lg border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500 p-2.5 focus:border-emerald-500 focus:outline-none border"
                  />
                </div>
                <div>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full text-xs rounded-lg border-slate-700 bg-slate-900 text-slate-200 p-2.5 focus:border-emerald-500 focus:outline-none border cursor-pointer"
                  >
                    <option value="admin">Administrator</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Register Operator
                </button>
              </motion.form>
            )}

            <div className="space-y-3.5">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-950/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm ${member.avatarColor}`}>
                      {member.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{member.email}</p>
                    </div>
                  </div>

                  {canEdit ? (
                    <select
                      value={member.role}
                      onChange={(e) => onChangeTeamMemberRole(member.id, e.target.value as Role)}
                      className="text-[10px] font-bold border border-slate-800 bg-slate-900 text-slate-300 rounded-lg py-1 px-1.5 focus:border-emerald-500 focus:outline-none uppercase tracking-wide cursor-pointer"
                    >
                      <option value="admin">ADMIN</option>
                      <option value="dispatcher">DISPATCH</option>
                      <option value="maintenance">MAINT</option>
                      <option value="viewer">VIEWER</option>
                    </select>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 uppercase tracking-wide">
                      {member.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
