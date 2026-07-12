/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import {
  seedDatabaseIfEmpty,
  fetchVehicles,
  fetchDrivers,
  fetchTrips,
  fetchMaintenance,
  fetchFuelLogs,
  fetchExpenses,
  fetchTeamMembers,
  fetchPermissions,
  fetchNotifications,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  addDriver,
  updateDriver,
  deleteDriver,
  addTrip,
  updateTrip,
  addMaintenance,
  updateMaintenance,
  addFuelLog,
  addExpense,
  addTeamMember,
  updateTeamMemberRole,
  updatePermissionDoc,
  resetPermissionsDoc,
  addNotificationDoc,
  markNotificationsAllRead,
  getUserProfile,
  setUserProfile,
} from './firebaseService';

import { Role, AppTab, Permission, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, TeamMember, SystemNotification, RolePermissionsMap } from './types';
import {
  initialRolePermissions,
  initialVehicles,
  initialDrivers,
  initialTrips,
  initialMaintenanceLogs,
  initialFuelLogs,
  initialExpenses,
  initialTeamMembers,
  initialNotifications,
} from './mockData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import VehiclesView from './components/VehiclesView';
import DriversView from './components/DriversView';
import TripsView from './components/TripsView';
import MaintenanceView from './components/MaintenanceView';
import FuelLogsView from './components/FuelLogsView';
import ExpensesView from './components/ExpensesView';
import ReportsView from './components/ReportsView';
import RbacView from './components/RbacView';
import SettingsView from './components/SettingsView';
import GlobalSearchOverlay from './components/GlobalSearchOverlay';

export default function App() {
  // Session and global loader/error states
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: Role } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI Navigation States
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Display theme state (light / dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('transitops_theme') as 'light' | 'dark') || 'dark';
  });

  // Synchronize document theme class
  useEffect(() => {
    localStorage.setItem('transitops_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard shortcut listener for Global Search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Firestore persistent database states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [permissions, setPermissions] = useState<RolePermissionsMap>(initialRolePermissions);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Synchronize with Firebase Auth and Firestore State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsLoading(true);
        setError(null);
        try {
          // 1. Seed database with starting fleet context if blank
          await seedDatabaseIfEmpty();

          // 2. Resolve user credential profile
          let profile = await getUserProfile(fbUser.uid);
          if (!profile) {
            let userRole: Role = 'viewer';
            let name = fbUser.email?.split('@')[0] || 'User';

            // Automatic preset alignment on first registration
            if (fbUser.email === 'admin@transitops.com') {
              userRole = 'admin';
              name = 'Administrator Chief';
            } else if (fbUser.email === 'dispatch@transitops.com') {
              userRole = 'dispatcher';
              name = 'Dispatcher Jones';
            } else if (fbUser.email === 'maint@transitops.com') {
              userRole = 'maintenance';
              name = 'Sandro Ramirez';
            } else if (fbUser.email === 'guest@transitops.com') {
              userRole = 'viewer';
              name = 'Jane Spector';
            }

            profile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              name,
              role: userRole,
            };
            await setUserProfile(fbUser.uid, profile);
          }

          setCurrentUser({
            name: profile.name,
            email: profile.email,
            role: profile.role,
          });

          // 3. Parallel fetching of all Firestore collections
          const [
            dbVehicles,
            dbDrivers,
            dbTrips,
            dbMaint,
            dbFuel,
            dbExpenses,
            dbTeam,
            dbPermissions,
            dbNotifs,
          ] = await Promise.all([
            fetchVehicles(),
            fetchDrivers(),
            fetchTrips(),
            fetchMaintenance(),
            fetchFuelLogs(),
            fetchExpenses(),
            fetchTeamMembers(),
            fetchPermissions(),
            fetchNotifications(),
          ]);

          setVehicles(dbVehicles);
          setDrivers(dbDrivers);
          setTrips(dbTrips);
          setMaintenance(dbMaint);
          setFuelLogs(dbFuel);
          setExpenses(dbExpenses);
          setTeamMembers(dbTeam);
          setPermissions(dbPermissions);
          setNotifications(dbNotifs);
        } catch (err: any) {
          console.error('Failed to synchronize Firestore indices:', err);
          setError('Database connectivity lost. Re-establishing secure link...');
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Operation logger helper for internal audits
  const addOperationLog = async (detail: string) => {
    const timestamp = new Date().toISOString();
    const newNotification = {
      title: 'Action Logged',
      message: `${currentUser?.name || 'System'}: ${detail}`,
      timestamp,
      type: 'info' as const,
      read: false,
    };
    try {
      const saved = await addNotificationDoc(newNotification);
      setNotifications((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('Failed to log operation:', err);
    }
  };

  const handleLogin = (role: Role, name: string, email: string) => {
    setCurrentUser({ name, email, role });
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleRoleChange = async (role: Role) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        role,
        name:
          role === 'admin'
            ? 'Administrator Chief'
            : role === 'dispatcher'
              ? 'Dispatcher Jones'
              : role === 'maintenance'
                ? 'Sandro Ramirez'
                : 'Jane Spector',
        email: `${role}@transitops.com`,
      };
      
      setCurrentUser(updatedUser);
      addOperationLog(`Swapped security credentials to ${role.toUpperCase()} context.`);

      if (auth.currentUser) {
        try {
          await setUserProfile(auth.currentUser.uid, {
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
          });
        } catch (err) {
          console.error('Failed to update session profile role:', err);
        }
      }
    }
  };

  // Permission togglers in RBAC
  const handlePermissionChange = async (
    role: Role,
    tab: AppTab,
    permission: Permission,
    value: boolean
  ) => {
    let updatedPerms: Permission[] = [];
    setPermissions((prev) => {
      const currentPerms = prev[role][tab] || [];
      if (value) {
        updatedPerms = [...currentPerms, permission];
        if (permission !== 'view' && !updatedPerms.includes('view')) {
          updatedPerms.push('view');
        }
      } else {
        updatedPerms = currentPerms.filter((p) => p !== permission);
        if (permission === 'view') {
          updatedPerms = [];
        }
      }

      const nextPermissions = {
        ...prev,
        [role]: {
          ...prev[role],
          [tab]: updatedPerms,
        },
      };

      updatePermissionDoc(role, nextPermissions[role]).catch((err) => {
        console.error('Failed to save permissions to Firebase:', err);
      });

      return nextPermissions;
    });
  };

  const handleResetPermissions = async () => {
    try {
      await resetPermissionsDoc();
      setPermissions(initialRolePermissions);
      addOperationLog('Restored safety security protocols to factory defaults.');
    } catch (err) {
      console.error('Failed to reset permissions:', err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await markNotificationsAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  // CRUD actions for Vehicles
  const handleAddVehicle = async (newUnit: Omit<Vehicle, 'id'>) => {
    try {
      const fresh = await addVehicle(newUnit);
      setVehicles((prev) => [fresh, ...prev]);
      addOperationLog(`Registered unit ${newUnit.code} inside fleet index.`);
    } catch (err) {
      console.error('Failed to add vehicle:', err);
    }
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      await updateVehicle(id, updates);
      setVehicles((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      const target = vehicles.find((u) => u.id === id);
      if (target) {
        addOperationLog(`Updated telemetry logs for unit ${target.code}.`);
      }
    } catch (err) {
      console.error('Failed to update vehicle:', err);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteVehicle(id);
      const target = vehicles.find((u) => u.id === id);
      setVehicles((prev) => prev.filter((u) => u.id !== id));
      if (target) {
        addOperationLog(`Decommissioned fleet unit ${target.code}.`);
      }
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
    }
  };

  // CRUD actions for Drivers
  const handleAddDriver = async (newDriver: Omit<Driver, 'id'>) => {
    try {
      const fresh = await addDriver(newDriver);
      setDrivers((prev) => [fresh, ...prev]);
      addOperationLog(`Enlisted operator ${newDriver.name} to active roster.`);
    } catch (err) {
      console.error('Failed to add driver:', err);
    }
  };

  const handleUpdateDriver = async (id: string, updates: Partial<Driver>) => {
    try {
      await updateDriver(id, updates);
      setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      const target = drivers.find((o) => o.id === id);
      if (target) {
        addOperationLog(`Modified dispatch status for operator ${target.name}.`);
      }
    } catch (err) {
      console.error('Failed to update driver:', err);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    try {
      await deleteDriver(id);
      const target = drivers.find((o) => o.id === id);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      if (target) {
        addOperationLog(`Removed operator ${target.name} from dispatch logs.`);
      }
    } catch (err) {
      console.error('Failed to delete driver:', err);
    }
  };

  // Dispatch Actions
  const handleAddTrip = async (newTrip: Omit<Trip, 'id'>) => {
    try {
      const fresh = await addTrip(newTrip);
      setTrips((prev) => [fresh, ...prev]);

      if (newTrip.status === 'Dispatched' || newTrip.status === 'En Route') {
        const driverUpdates = { status: 'On Trip' as const, assignedVehicleId: newTrip.vehicleId, updatedAt: new Date().toISOString() };
        await updateDriver(newTrip.driverId, driverUpdates);
        setDrivers((prev) =>
          prev.map((d) => (d.id === newTrip.driverId ? { ...d, ...driverUpdates } : d))
        );

        await updateVehicle(newTrip.vehicleId, { status: 'On Trip' });
        setVehicles((prev) =>
          prev.map((v) => (v.id === newTrip.vehicleId ? { ...v, status: 'On Trip' } : v))
        );
      } else {
        const targetDriver = drivers.find(d => d.id === newTrip.driverId);
        if (targetDriver && targetDriver.status === 'Off Duty') {
          await updateDriver(newTrip.driverId, { status: 'Available' });
          setDrivers((prev) =>
            prev.map((d) => (d.id === newTrip.driverId ? { ...d, status: 'Available' } : d))
          );
        }

        const targetVehicle = vehicles.find(v => v.id === newTrip.vehicleId);
        if (targetVehicle && targetVehicle.status === 'Active') {
          await updateVehicle(newTrip.vehicleId, { status: 'Available' });
          setVehicles((prev) =>
            prev.map((v) => (v.id === newTrip.vehicleId ? { ...v, status: 'Available' } : v))
          );
        }
      }

      addOperationLog(`Dispatched Trip Run ${newTrip.tripNumber} (${newTrip.routeName}).`);
    } catch (err) {
      console.error('Failed to add trip:', err);
    }
  };

  const handleUpdateTrip = async (id: string, updates: Partial<Trip>) => {
    try {
      await updateTrip(id, updates);
      setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      
      const target = trips.find((t) => t.id === id);
      if (target) {
        const newStatus = updates.status || target.status;
        addOperationLog(`Modified trip run ${target.tripNumber} status to ${newStatus}.`);

        if (updates.status && target.status !== updates.status) {
          if (updates.status === 'Dispatched') {
            const driverUpdates = { status: 'On Trip' as const, assignedVehicleId: target.vehicleId, updatedAt: new Date().toISOString() };
            await updateDriver(target.driverId, driverUpdates);
            setDrivers((prev) =>
              prev.map((d) => (d.id === target.driverId ? { ...d, ...driverUpdates } : d))
            );

            await updateVehicle(target.vehicleId, { status: 'On Trip' });
            setVehicles((prev) =>
              prev.map((v) => (v.id === target.vehicleId ? { ...v, status: 'On Trip' } : v))
            );
          } else if (updates.status === 'Completed' || updates.status === 'Cancelled') {
            const driverUpdates = { status: 'Available' as const, assignedVehicleId: null, updatedAt: new Date().toISOString() };
            await updateDriver(target.driverId, driverUpdates);
            setDrivers((prev) =>
              prev.map((d) => (d.id === target.driverId ? { ...d, ...driverUpdates } : d))
            );

            await updateVehicle(target.vehicleId, { status: 'Available' });
            setVehicles((prev) =>
              prev.map((v) => (v.id === target.vehicleId ? { ...v, status: 'Available' } : v))
            );
          }
        }
      }
    } catch (err) {
      console.error('Failed to update trip:', err);
    }
  };

  // CRUD actions for Maintenance
  const handleAddMaintenance = async (newMaint: Omit<MaintenanceLog, 'id'>) => {
    try {
      const fresh = await addMaintenance(newMaint);
      setMaintenance((prev) => [fresh, ...prev]);

      const vStatus = newMaint.status === 'In Progress' ? 'In Shop' : 'Maintenance';
      await updateVehicle(newMaint.vehicleId, { status: vStatus });
      setVehicles((prev) =>
        prev.map((v) => (v.id === newMaint.vehicleId ? { ...v, status: vStatus } : v))
      );

      const freshExpense: Expense = {
        id: 'e-m-' + fresh.id,
        category: 'Maintenance',
        description: `Service Order #${fresh.id} - ${fresh.serviceType} for unit`,
        amount: fresh.cost,
        date: fresh.date,
        referenceId: fresh.id,
        vehicleId: fresh.vehicleId,
      };
      const savedExpense = await addExpense(freshExpense);
      setExpenses((prev) => [savedExpense, ...prev]);

      addOperationLog(`Filed Repair Work-order ${fresh.id} on vehicle.`);
    } catch (err) {
      console.error('Failed to add maintenance:', err);
    }
  };

  const handleUpdateMaintenance = async (id: string, updates: Partial<MaintenanceLog>) => {
    try {
      await updateMaintenance(id, updates);
      setMaintenance((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
      
      const target = maintenance.find((m) => m.id === id);
      if (target) {
        const finalStatus = updates.status || target.status;
        addOperationLog(`Modified service order ${target.id} status to ${finalStatus}.`);

        if (updates.status) {
          if (updates.status === 'In Progress') {
            await updateVehicle(target.vehicleId, { status: 'In Shop' });
            setVehicles((prev) =>
              prev.map((v) => (v.id === target.vehicleId ? { ...v, status: 'In Shop' } : v))
            );
          } else if (updates.status === 'Completed') {
            const vUpdates = { status: 'Available' as const, lastServiceDate: new Date().toISOString().split('T')[0] };
            await updateVehicle(target.vehicleId, vUpdates);
            setVehicles((prev) =>
              prev.map((v) => (v.id === target.vehicleId ? { ...v, ...vUpdates } : v))
            );
          }
        }
      }
    } catch (err) {
      console.error('Failed to update maintenance:', err);
    }
  };

  // CRUD actions for Fuel logs
  const handleAddFuelLog = async (newFuel: Omit<FuelLog, 'id'>) => {
    try {
      const fresh = await addFuelLog(newFuel);
      setFuelLogs((prev) => [fresh, ...prev]);

      const vUpdates = { mileage: newFuel.odometerReading, fuelLevel: 100 };
      await updateVehicle(newFuel.vehicleId, vUpdates);
      setVehicles((prev) =>
        prev.map((v) => (v.id === newFuel.vehicleId ? { ...v, ...vUpdates } : v))
      );

      const freshExpense: Expense = {
        id: 'e-f-' + fresh.id,
        category: 'Fuel',
        description: `Refueling fuel logs #${fresh.id} at ${fresh.stationName}`,
        amount: fresh.cost,
        date: fresh.date,
        referenceId: fresh.id,
        vehicleId: fresh.vehicleId,
      };
      const savedExpense = await addExpense(freshExpense);
      setExpenses((prev) => [savedExpense, ...prev]);

      addOperationLog(`Filed refueling log for ${newFuel.gallons} gallons at ${newFuel.stationName}.`);
    } catch (err) {
      console.error('Failed to add fuel log:', err);
    }
  };

  // CRUD actions for Expenses
  const handleAddExpense = async (newExp: Omit<Expense, 'id'>) => {
    try {
      const fresh = await addExpense(newExp);
      setExpenses((prev) => [fresh, ...prev]);
      addOperationLog(`Filed financial expense record: ${newExp.description} ($${newExp.amount}).`);
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  // CRUD actions for Operators (RBAC)
  const handleAddTeamMember = async (name: string, email: string, role: Role) => {
    try {
      const colors = ['bg-emerald-600', 'bg-indigo-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];
      const freshMember = {
        name,
        email,
        role,
        status: 'Active' as const,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        joinedDate: new Date().toISOString().split('T')[0],
      };
      const fresh = await addTeamMember(freshMember);
      setTeamMembers((prev) => [...prev, fresh]);
      addOperationLog(`Registered operator account for ${name} with ${role.toUpperCase()} role.`);
    } catch (err) {
      console.error('Failed to add team member:', err);
    }
  };

  const handleChangeTeamMemberRole = async (id: string, role: Role) => {
    try {
      await updateTeamMemberRole(id, role);
      setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
      const target = teamMembers.find((m) => m.id === id);
      if (target) {
        addOperationLog(`Adjusted credential access of ${target.name} to ${role.toUpperCase()}.`);

        if (currentUser && target.email === currentUser.email) {
          setCurrentUser({ ...currentUser, role });
        }
      }
    } catch (err) {
      console.error('Failed to update team member role:', err);
    }
  };

  // UI Gating Checks
  const activeRole = currentUser?.role || 'viewer';
  const rolePermissions = permissions[activeRole];
  const activeTabPermissions = rolePermissions[activeTab] || [];
  const isTabAccessible = activeTabPermissions.includes('view');

  // Redirection block if unauthorized
  const renderTabContent = () => {
    if (!isTabAccessible) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-lg mt-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <div className="mx-auto h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Access Restricted by RBAC</h3>
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
            Your active role (<strong className="text-emerald-400 uppercase font-mono">{activeRole}</strong>) 
            does not hold the view clearance credentials needed to examine the 
            <strong className="text-slate-200 capitalize"> {activeTab}</strong> tab.
          </p>

          <div className="mt-8 space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
              Evaluate Security sandbox
            </span>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleRoleChange('admin')}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Impersonate Admin
              </button>
              <button
                onClick={() => handleRoleChange('dispatcher')}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Impersonate Dispatcher
              </button>
            </div>
            <span className="text-[9px] text-slate-500 italic block">
              Tip: Switch to Admin context above to adjust read permissions for other groups.
            </span>
          </div>
        </motion.div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            vehicles={vehicles}
            drivers={drivers}
            trips={trips}
            maintenance={maintenance}
            expenses={expenses}
            fuelLogs={fuelLogs}
            onAddLog={addOperationLog}
          />
        );
      case 'vehicles':
        return (
          <VehiclesView
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            permissions={activeTabPermissions}
          />
        );
      case 'drivers':
        return (
          <DriversView
            drivers={drivers}
            onAddDriver={handleAddDriver}
            onUpdateDriver={handleUpdateDriver}
            onDeleteDriver={handleDeleteDriver}
            permissions={activeTabPermissions}
          />
        );
      case 'trips':
        return (
          <TripsView
            trips={trips}
            drivers={drivers}
            vehicles={vehicles}
            onAddTrip={handleAddTrip}
            onUpdateTrip={handleUpdateTrip}
            permissions={activeTabPermissions}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceView
            maintenance={maintenance}
            vehicles={vehicles}
            onAddMaintenance={handleAddMaintenance}
            onUpdateMaintenance={handleUpdateMaintenance}
            permissions={activeTabPermissions}
          />
        );
      case 'fuel':
        return (
          <FuelLogsView
            fuelLogs={fuelLogs}
            vehicles={vehicles}
            drivers={drivers}
            onAddFuelLog={handleAddFuelLog}
            permissions={activeTabPermissions}
          />
        );
      case 'expenses':
        return (
          <ExpensesView
            expenses={expenses}
            vehicles={vehicles}
            onAddExpense={handleAddExpense}
            permissions={activeTabPermissions}
          />
        );
      case 'reports':
        return (
          <ReportsView
            vehicles={vehicles}
            drivers={drivers}
            trips={trips}
            maintenance={maintenance}
            fuelLogs={fuelLogs}
            expenses={expenses}
            onAddLog={addOperationLog}
          />
        );
      case 'rbac':
        return (
          <RbacView
            permissions={permissions}
            onChangePermission={handlePermissionChange}
            onResetPermissions={handleResetPermissions}
            teamMembers={teamMembers}
            onAddTeamMember={handleAddTeamMember}
            onChangeTeamMemberRole={handleChangeTeamMemberRole}
            canEdit={activeTabPermissions.includes('edit')}
          />
        );
      case 'settings':
        return (
          <SettingsView
            permissions={activeTabPermissions}
            onAddLog={addOperationLog}
            theme={theme}
            onThemeChange={setTheme}
          />
        );
      default:
        return null;
    }
  };

  // 1. If database connection error occurred, display recovery board
  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          <div className="mx-auto h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Database Connectivity Error</h3>
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-750 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reconnect Database
          </button>
        </div>
      </div>
    );
  }

  // 2. If database is resolving indices, show elegant loading dashboard
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="relative flex flex-col items-center">
          {/* Animated pulsing outer rings */}
          <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
            <svg className="w-8 h-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Initializing TransitOps</h2>
          <p className="text-xs text-slate-500 mt-2">Re-establishing secure cloud database link...</p>
        </div>
      </div>
    );
  }

  // 3. If session is unauthenticated, show Login Form
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={currentUser.role}
        permissionsMap={rolePermissions}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main content viewport wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Action Header */}
        <Header
          activeTab={activeTab}
          userRole={currentUser.role}
          userName={currentUser.name}
          userEmail={currentUser.email}
          onRoleChange={handleRoleChange}
          onLogout={handleLogout}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenSearch={() => setIsSearchOpen(true)}
          theme={theme}
          onThemeToggle={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />

        {/* Outer scrolling content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl">
            {/* Slide-in animate wrapper for view changing */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Modern Global Search Panel Overlay */}
      <GlobalSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        vehicles={vehicles}
        drivers={drivers}
        trips={trips}
        maintenance={maintenance}
        fuelLogs={fuelLogs}
        expenses={expenses}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
