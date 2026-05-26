// ============================================================
// IslandPost — Local Storage Data Layer
// All data is stored in localStorage with JSON serialization.
// Designed for easy migration to REST API / cloud DB later.
// ============================================================

import type {
  Parcel,
  User,
  ActivityLog,
  ImportBatch,
  DeliveryRecord,
  AppSettings,
  AuthSession,
} from '../types';

// Storage keys
const KEYS = {
  PARCELS: 'islandpost_parcels',
  USERS: 'islandpost_users',
  ACTIVITY: 'islandpost_activity',
  BATCHES: 'islandpost_batches',
  DELIVERIES: 'islandpost_deliveries',
  SETTINGS: 'islandpost_settings',
  SESSION: 'islandpost_session',
} as const;

// ─── Generic helpers ────────────────────────────────────────

function getAll<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveAll<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Parcels ────────────────────────────────────────────────

export const parcelStorage = {
  getAll(): Parcel[] {
    return getAll<Parcel>(KEYS.PARCELS);
  },

  getById(id: string): Parcel | undefined {
    return this.getAll().find((p) => p.id === id);
  },

  getByTracking(trackingNumber: string): Parcel | undefined {
    const tn = trackingNumber.toLowerCase().trim();
    return this.getAll().find((p) => p.trackingNumber.toLowerCase() === tn);
  },

  create(data: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>): Parcel {
    const parcel: Parcel = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = this.getAll();
    all.push(parcel);
    saveAll(KEYS.PARCELS, all);
    return parcel;
  },

  update(id: string, updates: Partial<Parcel>): Parcel | null {
    const all = this.getAll();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    saveAll(KEYS.PARCELS, all);
    return all[idx];
  },

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter((p) => p.id !== id);
    if (filtered.length === all.length) return false;
    saveAll(KEYS.PARCELS, filtered);
    return true;
  },

  bulkCreate(parcels: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>[]): Parcel[] {
    const all = this.getAll();
    const now = new Date().toISOString();
    const created = parcels.map((p) => ({
      ...p,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    saveAll(KEYS.PARCELS, [...all, ...created]);
    return created;
  },

  search(query: string, field: string = 'all'): Parcel[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();
    return this.getAll().filter((p) => {
      if (field === 'trackingNumber') return p.trackingNumber.toLowerCase().includes(q);
      if (field === 'customerName') return p.customerName.toLowerCase().includes(q);
      if (field === 'mobileNumber') return p.mobileNumber.includes(q);
      if (field === 'island') return p.island.toLowerCase().includes(q);
      if (field === 'address') return p.address.toLowerCase().includes(q);
      // all fields
      return (
        p.trackingNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.mobileNumber.includes(q) ||
        p.island.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.courierName.toLowerCase().includes(q)
      );
    });
  },

  exportToJSON(): string {
    return JSON.stringify(this.getAll(), null, 2);
  },
};

// ─── Users ──────────────────────────────────────────────────

export const userStorage = {
  getAll(): User[] {
    return getAll<User>(KEYS.USERS);
  },

  getById(id: string): User | undefined {
    return this.getAll().find((u) => u.id === id);
  },

  getByUsername(username: string): User | undefined {
    return this.getAll().find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  create(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const all = this.getAll();
    all.push(user);
    saveAll(KEYS.USERS, all);
    return user;
  },

  update(id: string, updates: Partial<User>): User | null {
    const all = this.getAll();
    const idx = all.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    saveAll(KEYS.USERS, all);
    return all[idx];
  },

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter((u) => u.id !== id);
    if (filtered.length === all.length) return false;
    saveAll(KEYS.USERS, filtered);
    return true;
  },
};

// ─── Activity Log ───────────────────────────────────────────

export const activityStorage = {
  getAll(): ActivityLog[] {
    return getAll<ActivityLog>(KEYS.ACTIVITY);
  },

  getRecent(limit = 50): ActivityLog[] {
    return this.getAll()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  log(entry: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const log: ActivityLog = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    const all = this.getAll();
    all.push(log);
    // Keep last 1000 entries
    if (all.length > 1000) all.splice(0, all.length - 1000);
    saveAll(KEYS.ACTIVITY, all);
  },
};

// ─── Import Batches ─────────────────────────────────────────

export const batchStorage = {
  getAll(): ImportBatch[] {
    return getAll<ImportBatch>(KEYS.BATCHES);
  },

  create(data: Omit<ImportBatch, 'id'>): ImportBatch {
    const batch: ImportBatch = { ...data, id: generateId() };
    const all = this.getAll();
    all.push(batch);
    saveAll(KEYS.BATCHES, all);
    return batch;
  },
};

// ─── Delivery Records ───────────────────────────────────────

export const deliveryStorage = {
  getAll(): DeliveryRecord[] {
    return getAll<DeliveryRecord>(KEYS.DELIVERIES);
  },

  create(data: Omit<DeliveryRecord, 'id'>): DeliveryRecord {
    const record: DeliveryRecord = { ...data, id: generateId() };
    const all = this.getAll();
    all.push(record);
    saveAll(KEYS.DELIVERIES, all);
    return record;
  },

  getByParcelId(parcelId: string): DeliveryRecord | undefined {
    return this.getAll().find((d) => d.parcelId === parcelId);
  },
};

// ─── App Settings ───────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  officeName: 'Island Post Office',
  islandName: 'Malé, Maldives',
  contactNumber: '+960 300-0000',
  emailAddress: 'info@islandpost.mv',
  logoText: 'IslandPost',
  darkMode: false,
  autoBackup: true,
  sessionTimeout: 60,
};

export const settingsStorage = {
  get(): AppSettings {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  save(settings: AppSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  update(updates: Partial<AppSettings>): AppSettings {
    const current = this.get();
    const updated = { ...current, ...updates };
    this.save(updated);
    return updated;
  },
};

// ─── Session Management ─────────────────────────────────────

export const sessionStorage2 = {
  get(): AuthSession | null {
    try {
      const raw = localStorage.getItem(KEYS.SESSION);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (new Date(session.expiresAt) < new Date()) {
        this.clear();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  set(session: AuthSession): void {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  },

  clear(): void {
    localStorage.removeItem(KEYS.SESSION);
  },
};

// ─── Database Backup & Restore ──────────────────────────────

export const backupRestore = {
  exportAll(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      parcels: parcelStorage.getAll(),
      users: userStorage.getAll(),
      activity: activityStorage.getAll(),
      batches: batchStorage.getAll(),
      deliveries: deliveryStorage.getAll(),
      settings: settingsStorage.get(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAll(json: string): { success: boolean; message: string } {
    try {
      const backup = JSON.parse(json);
      if (!backup.version) return { success: false, message: 'Invalid backup file format.' };
      if (backup.parcels) saveAll(KEYS.PARCELS, backup.parcels);
      if (backup.users) saveAll(KEYS.USERS, backup.users);
      if (backup.activity) saveAll(KEYS.ACTIVITY, backup.activity);
      if (backup.batches) saveAll(KEYS.BATCHES, backup.batches);
      if (backup.deliveries) saveAll(KEYS.DELIVERIES, backup.deliveries);
      if (backup.settings) settingsStorage.save(backup.settings);
      return { success: true, message: 'Database restored successfully.' };
    } catch {
      return { success: false, message: 'Failed to restore: invalid file.' };
    }
  },
};

// ─── Seed initial data ──────────────────────────────────────

export function seedInitialData(): void {
  // Only seed if no users exist
  if (userStorage.getAll().length > 0) return;

  // Simple hash simulation (in production use bcrypt)
  const hashPassword = (pw: string) => btoa(pw + '_islandpost_salt');

  userStorage.create({
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    fullName: 'System Administrator',
    isActive: true,
  });

  userStorage.create({
    username: 'staff1',
    passwordHash: hashPassword('staff123'),
    role: 'staff',
    fullName: 'Ahmed Rasheed',
    isActive: true,
  });

  // Seed some demo parcels
  const demoParcels = [
    {
      trackingNumber: 'DHL-2024-001',
      customerName: 'Fathimath Ali',
      mobileNumber: '7891234',
      address: 'Hulhumale, Block A',
      island: 'Hulhumale',
      description: 'Electronics - Laptop',
      arrivalDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      courierName: 'DHL',
      status: 'Ready for Collection' as const,
      remarks: 'Fragile - Handle with care',
      importBatchId: 'demo',
    },
    {
      trackingNumber: 'FEDEX-2024-002',
      customerName: 'Ibrahim Mohamed',
      mobileNumber: '9876543',
      address: 'Male, Maafannu',
      island: 'Malé',
      description: 'Clothing package',
      arrivalDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      courierName: 'FedEx',
      status: 'Received' as const,
      remarks: '',
      importBatchId: 'demo',
    },
    {
      trackingNumber: 'ARAMEX-2024-003',
      customerName: 'Aminath Shazna',
      mobileNumber: '7654321',
      address: 'Addu City, Hithadhoo',
      island: 'Addu City',
      description: 'Books and stationery',
      arrivalDate: new Date().toISOString().split('T')[0],
      courierName: 'Aramex',
      status: 'Ready for Collection' as const,
      remarks: 'Customer notified',
      importBatchId: 'demo',
    },
    {
      trackingNumber: 'UPS-2024-004',
      customerName: 'Hassan Waleed',
      mobileNumber: '9001122',
      address: 'Fuvahmulah',
      island: 'Fuvahmulah',
      description: 'Medical supplies',
      arrivalDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      courierName: 'UPS',
      status: 'Delivered' as const,
      remarks: 'Delivered on time',
      importBatchId: 'demo',
      deliveredAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      deliveredBy: 'staff1',
      receiverName: 'Hassan Waleed',
    },
    {
      trackingNumber: 'DHL-2024-005',
      customerName: 'Mariyam Nisha',
      mobileNumber: '7112233',
      address: 'Kulhudhuffushi',
      island: 'Kulhudhuffushi',
      description: 'Kitchen appliances',
      arrivalDate: new Date().toISOString().split('T')[0],
      courierName: 'DHL',
      status: 'Pending' as const,
      remarks: 'Awaiting customs clearance',
      importBatchId: 'demo',
    },
    {
      trackingNumber: 'FEDEX-2024-006',
      customerName: 'Ali Shafiu',
      mobileNumber: '9445566',
      address: 'Thinadhoo',
      island: 'Thinadhoo',
      description: 'Spare parts',
      arrivalDate: new Date().toISOString().split('T')[0],
      courierName: 'FedEx',
      status: 'Ready for Collection' as const,
      remarks: '',
      importBatchId: 'demo',
    },
  ];

  parcelStorage.bulkCreate(demoParcels);

  activityStorage.log({
    userId: 'system',
    username: 'system',
    action: 'SYSTEM_INIT',
    target: 'database',
    details: 'Initial database seeded with demo data',
  });
}

export { generateId };
