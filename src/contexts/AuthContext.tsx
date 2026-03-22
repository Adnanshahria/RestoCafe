import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface UserInfo {
  id: string;
  email: string;
  role: 'admin' | 'cashier';
  displayName: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: UserInfo | null;
  profile: { display_name: string; avatar_url: string | null } | null;
  role: 'admin' | 'cashier';
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      setUser({
        id: data.id,
        email: data.email,
        role: data.role,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
      });
    } catch {
      api.clearTokens();
      setUser(null);
    }
  }, []);

  // On mount, check for existing session
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const data = await api.post('/api/auth/register', { email, password, displayName });
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('refresh_token', data.refreshToken);
      setUser({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        displayName: data.user.displayName,
        avatarUrl: null,
      });
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof ApiError ? err.message : 'Registration failed' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('refresh_token', data.refreshToken);
      setUser({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        displayName: data.user.displayName,
        avatarUrl: data.user.avatarUrl || null,
      });
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof ApiError ? err.message : 'Login failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await api.post('/api/auth/logout', { refreshToken });
    } catch {
      // Ignore logout errors
    }
    api.clearTokens();
    setUser(null);
  }, []);

  const profile = user ? { display_name: user.displayName, avatar_url: user.avatarUrl } : null;
  const role = user?.role || 'cashier';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      isAuthenticated: !!user,
      isAdmin: role === 'admin',
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
