import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { apiLogin, loadInternalData, type DkmUser, type InternalData } from './api';

interface AuthState {
  user: DkmUser | null;
  loading: boolean;
  internalData: InternalData | null;
  internalLoading: boolean;
  login: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshInternal: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'dkm_user_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DkmUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalData, setInternalData] = useState<InternalData | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);

  const refreshInternal = useCallback(async () => {
    const currentUser = user;
    if (!currentUser) return;
    setInternalLoading(true);
    try {
      const data = await loadInternalData(currentUser.email);
      if (data.success) setInternalData(data);
    } catch (err) {
      console.error('Failed to load internal data:', err);
    } finally {
      setInternalLoading(false);
    }
  }, [user]);

  const login = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const res = await apiLogin(email);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem(STORAGE_KEY, res.user.email);
        // Load internal data immediately
        setInternalLoading(true);
        try {
          const data = await loadInternalData(res.user.email);
          if (data.success) setInternalData(data);
        } catch { /* ignore */ }
        setInternalLoading(false);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login gagal' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login gagal' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setInternalData(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Auto-login on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEY);
    if (savedEmail) {
      login(savedEmail);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, loading, internalData, internalLoading, login, logout, refreshInternal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
