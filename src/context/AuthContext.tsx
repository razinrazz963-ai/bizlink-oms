import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api, isDemoModeActive } from '../api/client.js';
import { DEMO_USER } from '../demo/demoData.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<void>;
  enterDemoMode: () => void;
  resetDemoData: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (allowed: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return isDemoModeActive();
  });
  const [user, setUser] = useState<User | null>(() => {
    if (isDemoModeActive()) return DEMO_USER;
    const saved = localStorage.getItem('bizlink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (isDemoModeActive()) return 'demo-session-token-bizlink';
    return localStorage.getItem('bizlink_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const demoActive = isDemoModeActive();
      if (demoActive) {
        setIsDemoMode(true);
        setUser(DEMO_USER);
        setToken('demo-session-token-bizlink');
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem('bizlink_token');
      if (storedToken) {
        try {
          const me = await api.getCurrentUser();
          setUser(me);
          localStorage.setItem('bizlink_user', JSON.stringify(me));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsDemoMode(false);
    localStorage.removeItem('bizlink_demo_mode');
    const res = await api.login({ email, password: pass });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('bizlink_token', res.token);
    localStorage.setItem('bizlink_user', JSON.stringify(res.user));
  };

  const enterDemoMode = () => {
    localStorage.setItem('bizlink_demo_mode', 'true');
    localStorage.setItem('bizlink_token', 'demo-session-token-bizlink');
    localStorage.setItem('bizlink_user', JSON.stringify(DEMO_USER));
    setIsDemoMode(true);
    setToken('demo-session-token-bizlink');
    setUser(DEMO_USER);
  };

  const resetDemoData = () => {
    localStorage.removeItem('bizlink_demo_data');
    api.resetDemoData();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('bizlink_token');
    localStorage.removeItem('bizlink_user');
    localStorage.removeItem('bizlink_demo_mode');
    localStorage.removeItem('bizlink_demo_data');
  };

  const refreshUser = async () => {
    if (isDemoModeActive()) {
      setUser(DEMO_USER);
      return;
    }
    try {
      const me = await api.getCurrentUser();
      setUser(me);
      localStorage.setItem('bizlink_user', JSON.stringify(me));
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const hasRole = (allowed: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return allowed.includes(user.role);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return Boolean(user.permissions && user.permissions.includes(permission));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isDemoMode, login, enterDemoMode, resetDemoData, logout, refreshUser, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
