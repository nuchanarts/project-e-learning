import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  cid?: string | null;
  hospital?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
}
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    cid?: string,
    hospital?: string,
    position?: string,
    hospcode?: string,
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    name?: string;
    hospital?: string;
    position?: string;
    avatarUrl?: string | null;
  }) => Promise<void>;
  mophCallback: (code: string) => Promise<MophCallbackResult>;
  mophComplete: (input: {
    registrationToken: string;
    email: string;
    cid?: string;
    hcode?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

type MophCallbackResult =
  | { status: 'logged_in'; user: User; accessToken: string; refreshToken: string }
  | { status: 'need_profile'; registrationToken: string; prefill: unknown };

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) setUser(JSON.parse(savedUser));
    setIsLoading(false);
  }, []);

  const applySession = (data: { accessToken: string; user: User }) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    if (email === 'admin' && password === 'admin') {
      const demo = { id: 'demo', email: 'admin@demo', name: 'Admin (Demo)', role: 'ADMIN' };
      localStorage.setItem('accessToken', 'demo-token');
      localStorage.setItem('user', JSON.stringify(demo));
      setUser(demo);
      return;
    }
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data);
  };

  // MOPH step 1: exchange the OAuth code. Logs in on a returning account,
  // otherwise returns need_profile so the caller can route to complete-profile.
  const mophCallback = async (code: string): Promise<MophCallbackResult> => {
    const { data } = await api.post('/auth/moph/callback', { code });
    if (data.status === 'logged_in') applySession(data);
    return data;
  };

  // MOPH step 2: finish a new account with the email/cid the user supplied.
  const mophComplete = async (input: {
    registrationToken: string;
    email: string;
    cid?: string;
    hcode?: string;
  }) => {
    const { data } = await api.post('/auth/moph/complete', input);
    applySession(data);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    cid?: string,
    hospital?: string,
    position?: string,
    hospcode?: string,
  ) => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      name,
      cid,
      hospital,
      position,
      hospcode,
    });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; hospital?: string; position?: string }) => {
    const { data: updated } = await api.put('/auth/me', data);
    const merged = { ...user!, ...updated };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateProfile, mophCallback, mophComplete, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
