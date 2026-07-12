/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'dispatcher' | 'maintenance' | 'viewer';

export type Permission = 'view' | 'create' | 'edit' | 'delete';

export type AppTab =
  | 'dashboard'
  | 'vehicles'
  | 'drivers'
  | 'trips'
  | 'maintenance'
  | 'fuel'
  | 'expenses'
  | 'reports'
  | 'rbac'
  | 'settings';

export interface ModulePermission {
  module: AppTab;
  permissions: Permission[];
}

export type RolePermissionsMap = Record<Role, Record<AppTab, Permission[]>>;

export interface Vehicle {
  id: string;
  code: string;
  name: string;
  type: 'Bus' | 'Heavy Truck' | 'Delivery Van' | 'Shuttle';
  status: 'Active' | 'Maintenance' | 'Out of Service' | 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  mileage: number; // in miles
  fuelType: 'Diesel' | 'Electric' | 'CNG' | 'Hybrid';
  fuelLevel: number; // percentage (0 - 100)
  licensePlate: string;
  year: number;
  lastServiceDate: string;
  registrationNumber: string;
  maxLoadCapacity: number; // in lbs
  acquisitionCost: number; // in USD
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string; // Unique
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number; // 0 to 100
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
  createdAt: string;
  updatedAt: string;
  // Backward compatibility fields
  email?: string;
  phone?: string;
  licenseType?: 'CDL Class A' | 'CDL Class B' | 'Standard' | string;
  rating?: number;
  assignedVehicleId?: string | null;
  joinedDate?: string;
}

export interface Trip {
  id: string;
  tripNumber: string;
  vehicleId: string;
  driverId: string;
  routeName: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  scheduledArrival: string;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled' | 'Scheduled' | 'En Route' | 'Delayed';
  passengers: number;
  stopsCount: number;
  cargoWeight?: number;
  plannedDistance?: number;
  startDate?: string;
  endDate?: string;
  source?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: 'Routine Inspection' | 'Engine Repair' | 'Brake Replacement' | 'Oil Change' | 'Tire Rotation' | 'Electrical Fix';
  description: string;
  cost: number;
  date: string;
  status: 'Pending' | 'Scheduled' | 'In Progress' | 'Completed';
  technicianName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  date: string;
  gallons: number;
  cost: number; // USD
  odometerReading: number;
  stationName: string;
}

export interface Expense {
  id: string;
  category: 'Fuel' | 'Maintenance' | 'Tolls' | 'Insurance' | 'Salaries' | 'Administrative' | 'Toll' | 'Repair' | 'Other';
  description: string;
  amount: number;
  date: string;
  referenceId?: string;
  vehicleId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Inactive';
  avatarColor: string;
  joinedDate: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  read: boolean;
}
