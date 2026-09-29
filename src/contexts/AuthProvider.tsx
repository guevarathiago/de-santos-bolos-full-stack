import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { login as loginRequest, register as registerRequest } from '../services/auth';
import type { LoginPayload, RegisterPayload, User } from '../services/auth';

const STORAGE_KEY = 'user';

const loadStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const saveUser = (user: User) => {
    setUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      return;
    }
  };

  const login = async (payload: LoginPayload) => {
    const { user } = await loginRequest(payload);
    saveUser(user);
  };

  const register = async (payload: RegisterPayload) => {
    const { user } = await registerRequest(payload);
    saveUser(user);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      return;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
