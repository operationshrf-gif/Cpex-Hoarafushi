// ============================================================
// IslandPost Parcel Management System — Core Types
// ============================================================

export type ParcelStatus =
  | 'Received'
  | 'Ready for Collection'
  | 'Delivered'
  | 'Returned'
  | 'Pending';

export type UserRole = 'admin' | 'staff' | 'customer';

export interface Parcel {
  id: string;
  trackingNumber: string;
  customerName: string;
  mobileNumber: string;
  address: string;
  island: string;
  description: string;
  arrivalDate: string;         // ISO date string
  courierName: string;
  status: ParcelStatus;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  deliveredBy?: string;
  receiverName?: string;
  importBatchId?: string;
}

export interface DeliveryRecord {
  id: string;
  parcelId: string;
  trackingNumber: string;
  customerName: string;
  deliveredAt: string;
  deliveredBy: string;
  receiverName: string;
  staffNotes?: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface ImportBatch {
  id: string;
  filename: string;
  importedAt: string;
  importedBy: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  data?: string;
}

export interface ImportPreviewRow {
  row: number;
  trackingNumber: string;
  customerName: string;
  mobileNumber: string;
  address: string;
  island: string;
  description: string;
  arrivalDate: string;
  courierName: string;
  status: ParcelStatus;
  remarks: string;
  errors: ImportError[];
  isDuplicate: boolean;
}

export interface DashboardStats {
  totalParcels: number;
  readyForCollection: number;
  deliveredToday: number;
  pendingParcels: number;
  receivedToday: number;
  returnedParcels: number;
}

export interface SearchFilters {
  query: string;
  field: 'all' | 'trackingNumber' | 'customerName' | 'mobileNumber' | 'island' | 'address';
  status?: ParcelStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface AppSettings {
  officeName: string;
  islandName: string;
  contactNumber: string;
  emailAddress: string;
  logoText: string;
  darkMode: boolean;
  autoBackup: boolean;
  sessionTimeout: number; // minutes
}

export interface AuthSession {
  userId: string;
  username: string;
  role: UserRole;
  fullName: string;
  loginAt: string;
  expiresAt: string;
}
