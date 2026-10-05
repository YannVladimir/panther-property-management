import { api, setAccessToken, setStoredRefreshToken } from './client';
import { User, UserRole } from '../types';

interface BackendUserResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  title?: string;
  clientId?: number;
  employeeId?: number;
  status: string;
  mustChangePassword: boolean;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUserResponse;
}

/** Backend roles are UPPER_SNAKE enum names; the frontend's UserRole union is lowercase. */
function toFrontendUser(u: BackendUserResponse): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role.toLowerCase() as UserRole,
    avatar: u.avatarUrl ?? '',
    title: u.title,
    clientId: u.clientId !== undefined ? String(u.clientId) : undefined,
    employeeId: u.employeeId !== undefined ? String(u.employeeId) : undefined,
  };
}

export interface Session {
  user: User;
  mustChangePassword: boolean;
}

function applyAuthResponse(res: AuthResponse): Session {
  setAccessToken(res.accessToken);
  setStoredRefreshToken(res.refreshToken);
  return { user: toFrontendUser(res.user), mustChangePassword: res.user.mustChangePassword };
}

export async function login(email: string, password: string): Promise<Session> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password }, true);
  return applyAuthResponse(res);
}

export async function refreshSession(refreshToken: string): Promise<Session> {
  const res = await api.post<AuthResponse>('/auth/refresh', { refreshToken }, true);
  return applyAuthResponse(res);
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await api.get<BackendUserResponse>('/auth/me');
  return toFrontendUser(res);
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
    setStoredRefreshToken(null);
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email }, true);
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { resetToken, newPassword }, true);
}
