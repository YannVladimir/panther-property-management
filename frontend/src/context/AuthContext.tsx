import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  demoAccounts: { role: UserRole; label: string; user: User; description: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const demoAccounts: { role: UserRole; label: string; user: User; description: string }[] = [
  {
    role: 'operations',
    label: 'Operations Manager',
    user: mockUsers.find((u) => u.role === 'operations')!,
    description: 'Manages bookings, payments, staff, preventive tasks, meters & expenses',
  },
  {
    role: 'client',
    label: 'Client (Tenant)',
    user: mockUsers.find((u) => u.role === 'client')!,
    description: 'Jean-Paul Ndahiro (Room A-204) — rent receipts, inventory & issue reporting',
  },
  {
    role: 'owner',
    label: 'Property Owner',
    user: mockUsers.find((u) => u.role === 'owner')!,
    description: 'Executive financial analytics, occupancy rates, ROI & smart alerts',
  },
  {
    role: 'household',
    label: 'Household / Staff',
    user: mockUsers.find((u) => u.role === 'household')!,
    description: 'Facility inspection checklists, task execution & salary slips',
  },
  {
    role: 'admin',
    label: 'System Admin',
    user: mockUsers.find((u) => u.role === 'admin')!,
    description: 'System config, properties/rooms CRUD, rental types & users',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedRole = localStorage.getItem('panther_user_role') as UserRole;
    if (savedRole && savedRole !== 'public') {
      const user = mockUsers.find((u) => u.role === savedRole);
      return user || mockUsers[0];
    }
    return mockUsers[0]; // Default to Operations Manager for best rich initial demonstration
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser ? currentUser.role : 'operations';
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('panther_user_role', currentUser.role);
      setCurrentRole(currentUser.role);
    } else {
      localStorage.setItem('panther_user_role', 'public');
      setCurrentRole('public');
    }
  }, [currentUser]);

  const switchRole = (role: UserRole) => {
    if (role === 'public') {
      setCurrentUser(null);
      setCurrentRole('public');
      return;
    }
    const foundUser = mockUsers.find((u) => u.role === role);
    if (foundUser) {
      setCurrentUser(foundUser);
      setCurrentRole(role);
    }
  };

  const login = (email: string, targetRole?: UserRole) => {
    let found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found && targetRole) {
      found = mockUsers.find((u) => u.role === targetRole);
    }
    if (found) {
      setCurrentUser(found);
      setCurrentRole(found.role);
      return true;
    }
    // Fallback: log in as default operations
    setCurrentUser(mockUsers[0]);
    setCurrentRole('operations');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRole('public');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated: currentRole !== 'public' && currentUser !== null,
        switchRole,
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
