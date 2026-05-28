// ============================================================
// IslandPost — Supabase Data Layer
// All data is now stored in Supabase tables via the Supabase client.
// ============================================================

import { supabase } from './supabaseClient';
import type { Parcel, User, ActivityLog, ImportBatch, DeliveryRecord, AppSettings, AuthSession } from '../types';

// Helper to handle Supabase errors
function handleError<T>(response: { data: T | null; error: any }) {
  if (response.error) {
    console.error('Supabase error:', response.error);
    throw response.error;
  }
  return response.data as T;
}

// Simple ID generator (fallback for client‑side IDs)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Parcels ────────────────────────────────────────────────
export const parcelStorage = {
  async getAll(): Promise<Parcel[]> {
    const { data, error } = await supabase.from('parcels').select('*');
    return handleError(data);
  },

  async getById(id: string): Promise<Parcel | null> {
    const { data, error } = await supabase.from('parcels').select('*').eq('id', id).single();
    return error ? null : (data as Parcel);
  },

  async getByTracking(trackingNumber: string): Promise<Parcel | null> {
    const tn = trackingNumber.toLowerCase().trim();
    const { data, error } = await supabase.from('parcels').select('*').ilike('trackingNumber', tn).single();
    return error ? null : (data as Parcel);
  },

  async create(data: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>): Promise<Parcel> {
    const parcel = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const { data: inserted, error } = await supabase.from('parcels').insert(parcel).single();
    return handleError(inserted);
  },

  async update(id: string, updates: Partial<Parcel>): Promise<Parcel | null> {
    const { data, error } = await supabase.from('parcels').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', id).single();
    return error ? null : (data as Parcel);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('parcels').delete().eq('id', id);
    return !error;
  },

  async bulkCreate(parcels: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Parcel[]> {
    const now = new Date().toISOString();
    const payload = parcels.map(p => ({ ...p, createdAt: now, updatedAt: now }));
    const { data, error } = await supabase.from('parcels').insert(payload);
    return handleError(data);
  },

  async search(query: string, field: string = 'all'): Promise<Parcel[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();
    // Simple client‑side filter after fetching all parcels (can be optimized with RPC)
    const all = await this.getAll();
    return all.filter(p => {
      const includes = (val: string) => val?.toLowerCase().includes(q);
      if (field === 'trackingNumber') return includes(p.trackingNumber);
      if (field === 'customerName') return includes(p.customerName);
      if (field === 'mobileNumber') return p.mobileNumber.includes(q);
      if (field === 'island') return includes(p.island);
      if (field === 'address') return includes(p.address);
      return (
        includes(p.trackingNumber) ||
        includes(p.customerName) ||
        p.mobileNumber.includes(q) ||
        includes(p.island) ||
        includes(p.address) ||
        includes(p.courierName)
      );
    });
  },

  async exportToJSON(): Promise<string> {
    const all = await this.getAll();
    return JSON.stringify(all, null, 2);
  },
};

// ─── Users ──────────────────────────────────────────────────
export const userStorage = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    return handleError(data);
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    return error ? null : (data as User);
  },

  async getByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    return error ? null : (data as User);
  },

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user = { ...data, createdAt: new Date().toISOString() };
    const { data: inserted, error } = await supabase.from('users').insert(user).single();
    return handleError(inserted);
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).single();
    return error ? null : (data as User);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  },
};

// ─── Activity Log ───────────────────────────────────────────
export const activityStorage = {
  async getAll(): Promise<ActivityLog[]> {
    const { data, error } = await supabase.from('activity').select('*');
    return handleError(data);
  },

  async getRecent(limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase.from('activity').select('*').order('timestamp', { ascending: false }).limit(limit);
    return handleError(data);
  },

  async log(entry: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const log = { ...entry, timestamp: new Date().toISOString() };
    const { error } = await supabase.from('activity').insert(log);
    if (error) console.error('Activity log error:', error);
  },
};

// ─── Import Batches ─────────────────────────────────────────
export const batchStorage = {
  async getAll(): Promise<ImportBatch[]> {
    const { data, error } = await supabase.from('batches').select('*');
    return handleError(data);
  },

  async create(data: Omit<ImportBatch, 'id'>): Promise<ImportBatch> {
    const { data: inserted, error } = await supabase.from('batches').insert(data).single();
    return handleError(inserted);
  },
};

// ─── Delivery Records ───────────────────────────────────────
export const deliveryStorage = {
  async getAll(): Promise<DeliveryRecord[]> {
    const { data, error } = await supabase.from('deliveries').select('*');
    return handleError(data);
  },

  async create(data: Omit<DeliveryRecord, 'id'>): Promise<DeliveryRecord> {
    const { data: inserted, error } = await supabase.from('deliveries').insert(data).single();
    return handleError(inserted);
  },

  async getByParcelId(parcelId: string): Promise<DeliveryRecord | null> {
    const { data, error } = await supabase.from('deliveries').select('*').eq('parcelId', parcelId).single();
    return error ? null : (data as DeliveryRecord);
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
  async get(): Promise<AppSettings> {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error || !data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(data as AppSettings) };
  },

  async save(settings: AppSettings): Promise<void> {
    // Upsert a single row (id = 1)
    await supabase.from('settings').upsert({ id: 1, ...settings });
  },

  async update(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const updated = { ...current, ...updates };
    await this.save(updated);
    return updated;
  },
};

// ─── Session Management ─────────────────────────────────────
export const sessionStorage2 = {
  async get(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    const session = data.session;
    if (!session) return null;
    // Cast to our AuthSession shape (adjust fields as needed)
    const sess = session as unknown as AuthSession;
    if (new Date(sess.expiresAt) < new Date()) {
      await this.clear();
      return null;
    }
    return sess;
  },

  async set(_: AuthSession): Promise<void> {
    // Supabase automatically manages session after signIn; placeholder
    return;
  },

  async clear(): Promise<void> {
    await supabase.auth.signOut();
  },
};

// ─── Database Backup & Restore ──────────────────────────────
export const backupRestore = {
  async exportAll(): Promise<string> {
    const [parcels, users, activity, batches, deliveries, settings] = await Promise.all([
      parcelStorage.getAll(),
      userStorage.getAll(),
      activityStorage.getAll(),
      batchStorage.getAll(),
      deliveryStorage.getAll(),
      settingsStorage.get(),
    ]);
    const backup = { version: '1.0', exportedAt: new Date().toISOString(), parcels, users, activity, batches, deliveries, settings };
    return JSON.stringify(backup, null, 2);
  },

  async importAll(json: string): Promise<{ success: boolean; message: string }> {
    try {
      const backup = JSON.parse(json);
      if (!backup.version) return { success: false, message: 'Invalid backup file format.' };
      if (backup.parcels) await supabase.from('parcels').upsert(backup.parcels);
      if (backup.users) await supabase.from('users').upsert(backup.users);
      if (backup.activity) await supabase.from('activity').upsert(backup.activity);
      if (backup.batches) await supabase.from('batches').upsert(backup.batches);
      if (backup.deliveries) await supabase.from('deliveries').upsert(backup.deliveries);
      if (backup.settings) await supabase.from('settings').upsert(backup.settings);
      return { success: true, message: 'Database restored successfully.' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to restore: invalid file.' };
    }
  },
};

// ─── Seed initial data ──────────────────────────────────────
export async function seedInitialData(): Promise<void> {
  const users = await userStorage.getAll();
  if (users.length > 0) return;

  const hashPassword = (pw: string) => btoa(pw + '_islandpost_salt');

  await userStorage.create({
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    fullName: 'System Administrator',
    isActive: true,
  });

  await userStorage.create({
    username: 'staff1',
    passwordHash: hashPassword('staff123'),
    role: 'staff',
    fullName: 'Ahmed Rasheed',
    isActive: true,
  });

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
      status: 'Ready for Collection',
      remarks: 'Fragile - Handle with care',
      importBatchId: 'demo',
    },
    // Additional demo parcels can be added here
  ];

  await parcelStorage.bulkCreate(demoParcels as any);

  await activityStorage.log({
    userId: 'system',
    username: 'system',
    action: 'SYSTEM_INIT',
    target: 'database',
    details: 'Initial database seeded with demo data',
  });
}

export { generateId };
