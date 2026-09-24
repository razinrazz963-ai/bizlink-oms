import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (allowed: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bizlink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bizlink_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
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
    const res = await api.login({ email, password: pass });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('bizlink_token', res.token);
    localStorage.setItem('bizlink_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bizlink_token');
    localStorage.removeItem('bizlink_user');
  };

  const refreshUser = async () => {
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
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
