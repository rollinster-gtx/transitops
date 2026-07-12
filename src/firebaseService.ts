/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  TeamMember,
  SystemNotification,
  RolePermissionsMap,
  Role,
  AppTab,
  Permission,
} from './types';
import {
  initialVehicles,
  initialDrivers,
  initialTrips,
  initialMaintenanceLogs,
  initialFuelLogs,
  initialExpenses,
  initialTeamMembers,
  initialNotifications,
  initialRolePermissions,
} from './mockData';

// ----------------------------------------------------
// DATABASE SEEDING
// ----------------------------------------------------
export async function seedDatabaseIfEmpty() {
  const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
  if (!vehiclesSnap.empty) {
    return; // Database is already populated
  }

  const batch = writeBatch(db);

  // Seed Vehicles
  initialVehicles.forEach((v) => {
    batch.set(doc(db, 'vehicles', v.id), v);
  });

  // Seed Drivers
  initialDrivers.forEach((d) => {
    batch.set(doc(db, 'drivers', d.id), d);
  });

  // Seed Trips
  initialTrips.forEach((t) => {
    batch.set(doc(db, 'trips', t.id), t);
  });

  // Seed Maintenance
  initialMaintenanceLogs.forEach((m) => {
    batch.set(doc(db, 'maintenance', m.id), m);
  });

  // Seed Fuel Logs
  initialFuelLogs.forEach((f) => {
    batch.set(doc(db, 'fuelLogs', f.id), f);
  });

  // Seed Expenses
  initialExpenses.forEach((e) => {
    batch.set(doc(db, 'expenses', e.id), e);
  });

  // Seed Team Members
  initialTeamMembers.forEach((tm) => {
    batch.set(doc(db, 'teamMembers', tm.id), tm);
  });

  // Seed Notifications
  initialNotifications.forEach((n) => {
    batch.set(doc(db, 'notifications', n.id), n);
  });

  // Seed Permissions
  Object.entries(initialRolePermissions).forEach(([role, perms]) => {
    batch.set(doc(db, 'permissions', role), perms);
  });

  await batch.commit();
}

// ----------------------------------------------------
// FETCH ACTIONS
// ----------------------------------------------------
export async function fetchVehicles(): Promise<Vehicle[]> {
  const snap = await getDocs(collection(db, 'vehicles'));
  const list: Vehicle[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as Vehicle);
  });
  return list.sort((a, b) => a.code.localeCompare(b.code));
}

export async function fetchDrivers(): Promise<Driver[]> {
  const snap = await getDocs(collection(db, 'drivers'));
  const list: Driver[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as Driver);
  });
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchTrips(): Promise<Trip[]> {
  const snap = await getDocs(collection(db, 'trips'));
  const list: Trip[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as Trip);
  });
  // Sort descending by scheduledDeparture
  return list.sort((a, b) => b.scheduledDeparture.localeCompare(a.scheduledDeparture));
}

export async function fetchMaintenance(): Promise<MaintenanceLog[]> {
  const snap = await getDocs(collection(db, 'maintenance'));
  const list: MaintenanceLog[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as MaintenanceLog);
  });
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchFuelLogs(): Promise<FuelLog[]> {
  const snap = await getDocs(collection(db, 'fuelLogs'));
  const list: FuelLog[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as FuelLog);
  });
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchExpenses(): Promise<Expense[]> {
  const snap = await getDocs(collection(db, 'expenses'));
  const list: Expense[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as Expense);
  });
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const snap = await getDocs(collection(db, 'teamMembers'));
  const list: TeamMember[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as TeamMember);
  });
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchNotifications(): Promise<SystemNotification[]> {
  const snap = await getDocs(collection(db, 'notifications'));
  const list: SystemNotification[] = [];
  snap.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as SystemNotification);
  });
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function fetchPermissions(): Promise<RolePermissionsMap> {
  const snap = await getDocs(collection(db, 'permissions'));
  const perms: RolePermissionsMap = {} as RolePermissionsMap;
  snap.forEach((docSnap) => {
    perms[docSnap.id as Role] = docSnap.data() as any;
  });

  // Fallback to initial permissions if database permissions load empty
  if (Object.keys(perms).length === 0) {
    return initialRolePermissions;
  }
  return perms;
}

// ----------------------------------------------------
// CRUD MUTATIONS
// ----------------------------------------------------

// Vehicles
export async function addVehicle(newUnit: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  const id = 'v-' + Date.now();
  const fresh: Vehicle = { ...newUnit, id };
  await setDoc(doc(db, 'vehicles', id), fresh);
  return fresh;
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
  await updateDoc(doc(db, 'vehicles', id), updates);
}

export async function deleteVehicle(id: string): Promise<void> {
  await deleteDoc(doc(db, 'vehicles', id));
}

// Drivers
export async function addDriver(newDriver: Omit<Driver, 'id'>): Promise<Driver> {
  const id = 'd-' + Date.now();
  const fresh: Driver = { ...newDriver, id };
  await setDoc(doc(db, 'drivers', id), fresh);
  return fresh;
}

export async function updateDriver(id: string, updates: Partial<Driver>): Promise<void> {
  await updateDoc(doc(db, 'drivers', id), updates);
}

export async function deleteDriver(id: string): Promise<void> {
  await deleteDoc(doc(db, 'drivers', id));
}

// Trips
export async function addTrip(newTrip: Omit<Trip, 'id'>): Promise<Trip> {
  const id = 't-' + Date.now();
  const fresh: Trip = { ...newTrip, id };
  await setDoc(doc(db, 'trips', id), fresh);
  return fresh;
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<void> {
  await updateDoc(doc(db, 'trips', id), updates);
}

// Maintenance
export async function addMaintenance(newMaint: Omit<MaintenanceLog, 'id'>): Promise<MaintenanceLog> {
  const id = 'm-' + Date.now();
  const fresh: MaintenanceLog = { ...newMaint, id };
  await setDoc(doc(db, 'maintenance', id), fresh);
  return fresh;
}

export async function updateMaintenance(id: string, updates: Partial<MaintenanceLog>): Promise<void> {
  await updateDoc(doc(db, 'maintenance', id), updates);
}

// Fuel logs
export async function addFuelLog(newFuel: Omit<FuelLog, 'id'>): Promise<FuelLog> {
  const id = 'f-' + Date.now();
  const fresh: FuelLog = { ...newFuel, id };
  await setDoc(doc(db, 'fuelLogs', id), fresh);
  return fresh;
}

// Expenses
export async function addExpense(newExp: Omit<Expense, 'id'> & { id?: string }): Promise<Expense> {
  const id = newExp.id || 'e-' + Date.now();
  const fresh: Expense = {
    category: newExp.category,
    description: newExp.description,
    amount: newExp.amount,
    date: newExp.date,
    referenceId: newExp.referenceId,
    vehicleId: newExp.vehicleId,
    id,
  };
  await setDoc(doc(db, 'expenses', id), fresh);
  return fresh;
}

// Team Members (RBAC)
export async function addTeamMember(newMember: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  const id = 'tm-' + Date.now();
  const fresh: TeamMember = { ...newMember, id };
  await setDoc(doc(db, 'teamMembers', id), fresh);
  return fresh;
}

export async function updateTeamMemberRole(id: string, role: Role): Promise<void> {
  await updateDoc(doc(db, 'teamMembers', id), { role });
}

// Permissions
export async function updatePermissionDoc(role: Role, permissions: any): Promise<void> {
  await setDoc(doc(db, 'permissions', role), permissions);
}

export async function resetPermissionsDoc(): Promise<void> {
  const batch = writeBatch(db);
  Object.entries(initialRolePermissions).forEach(([role, perms]) => {
    batch.set(doc(db, 'permissions', role), perms);
  });
  await batch.commit();
}

// Notifications / Action logs
export async function addNotificationDoc(newNotif: Omit<SystemNotification, 'id'>): Promise<SystemNotification> {
  const id = 'n-' + Date.now();
  const fresh: SystemNotification = { ...newNotif, id };
  await setDoc(doc(db, 'notifications', id), fresh);
  return fresh;
}

export async function markNotificationsAllRead(): Promise<void> {
  const snap = await getDocs(collection(db, 'notifications'));
  const batch = writeBatch(db);
  snap.forEach((docSnap) => {
    batch.update(docSnap.ref, { read: true });
  });
  await batch.commit();
}

// ----------------------------------------------------
// USER PROFILES
// ----------------------------------------------------
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function setUserProfile(uid: string, profile: Omit<UserProfile, 'uid'>): Promise<void> {
  await setDoc(doc(db, 'users', uid), { ...profile, uid });
}
