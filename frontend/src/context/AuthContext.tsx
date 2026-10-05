import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import * as authApi from '../api/auth';
import { getStoredRefreshToken, setSessionExpiredHandler } from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  /** True until the initial session-restore attempt (via a stored refresh token) has finished. */
  isInitializing: boolean;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  demoAccounts: { role: UserRole; label: string; email: string; description: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Dev-only quick login — real accounts migrated from mock data, all share the password@123 password. */
export const demoAccounts: { role: UserRole; label: string; email: string; description: string }[] = [
  {
    role: 'operations',
    label: 'Operations Manager',
    email: 'operations@panther.rw',
    description: 'Manages bookings, payments, staff, preventive tasks, meters & expenses',
  },
  {
    role: 'client',
    label: 'Client (Tenant)',
    email: 'jp.ndahiro@gmail.com',
    description: 'Jean-Paul Ndahiro — rent receipts, inventory & issue reporting',
  },
  {
    role: 'owner',
    label: 'Property Owner',
    email: 'owner@panther.rw',
    description: 'Executive financial analytics, occupancy rates, ROI & smart alerts',
  },
  {
    role: 'household',
    label: 'Household / Staff',
    email: 'emmanuel.h@panther.rw',
    description: 'Facility inspection checklists, task execution & salary slips',
  },
  {
    role: 'admin',
    label: 'System Admin',
    email: 'admin@panther.rw',
    description: 'System config, properties/rooms CRUD, rental types & users',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    setMustChangePassword(false);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    const storedRefreshToken = getStoredRefreshToken();
    if (!storedRefreshToken) {
      setIsInitializing(false);
      return;
    }
    authApi
      .refreshSession(storedRefreshToken)
      .then((session) => {
        setCurrentUser(session.user);
        setMustChangePassword(session.mustChangePassword);
      })
      .catch(() => clearSession())
      .finally(() => setIsInitializing(false));
  }, [clearSession]);

  const login = async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setCurrentUser(session.user);
    setMustChangePassword(session.mustChangePassword);
  };

  const logout = async () => {
    await authApi.logout().catch(() => undefined);
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role ?? 'public',
        isAuthenticated: currentUser !== null,
        isInitializing,
        mustChangePassword,
        login,
        logout,
        demoAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
