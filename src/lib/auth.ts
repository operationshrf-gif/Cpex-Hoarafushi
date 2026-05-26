// ============================================================
// IslandPost — Authentication & Authorization
// ============================================================

import { userStorage, sessionStorage2, activityStorage } from './storage';
import type { AuthSession, UserRole } from '../types';

const SESSION_DURATION_MINUTES = 60;

// Simple hash (production should use bcrypt via backend)
function hashPassword(password: string): string {
  return btoa(password + '_islandpost_salt');
}

export function login(
  username: string,
  password: string
): { success: boolean; session?: AuthSession; error?: string } {
  const user = userStorage.getByUsername(username);

  if (!user) {
    return { success: false, error: 'Invalid username or password.' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Account is disabled. Contact administrator.' };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    loginAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  sessionStorage2.set(session);

  // Update last login
  userStorage.update(user.id, { lastLogin: now.toISOString() });

  activityStorage.log({
    userId: user.id,
    username: user.username,
    action: 'LOGIN',
    target: 'auth',
    details: `User logged in successfully`,
  });

  return { success: true, session };
}

export function logout(session: AuthSession | null): void {
  if (session) {
    activityStorage.log({
      userId: session.userId,
      username: session.username,
      action: 'LOGOUT',
      target: 'auth',
      details: `User logged out`,
    });
  }
  sessionStorage2.clear();
}

export function getSession(): AuthSession | null {
  return sessionStorage2.get();
}

export function hasPermission(session: AuthSession | null, requiredRole: UserRole): boolean {
  if (!session) return false;
  const hierarchy: Record<UserRole, number> = { admin: 3, staff: 2, customer: 1 };
  return hierarchy[session.role] >= hierarchy[requiredRole];
}

export function createUser(
  username: string,
  password: string,
  role: UserRole,
  fullName: string
): { success: boolean; error?: string } {
  if (userStorage.getByUsername(username)) {
    return { success: false, error: 'Username already exists.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  userStorage.create({
    username,
    passwordHash: hashPassword(password),
    role,
    fullName,
    isActive: true,
  });

  return { success: true };
}

export function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const user = userStorage.getById(userId);
  if (!user) return { success: false, error: 'User not found.' };

  if (user.passwordHash !== hashPassword(currentPassword)) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  userStorage.update(userId, { passwordHash: hashPassword(newPassword) });
  return { success: true };
}

export function resetPassword(
  userId: string,
  newPassword: string
): { success: boolean; error?: string } {
  const user = userStorage.getById(userId);
  if (!user) return { success: false, error: 'User not found.' };

  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  userStorage.update(userId, { passwordHash: hashPassword(newPassword) });
  return { success: true };
}
