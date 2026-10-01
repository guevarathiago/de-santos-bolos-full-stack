import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from './AuthContext';
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../services/auth';
import type { LoginPayload, RegisterPayload, User } from '../services/auth';

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    getMe()
      .then(({ user: currentUser }) => {
        if (!ignore) setUser(currentUser);
      })
      .catch(() => {
        if (!ignore) setUser(null);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: loggedUser } = await loginRequest(payload);
    setUser(loggedUser);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: newUser } = await registerRequest(payload);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest().catch(() => undefined);
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};

export default AuthProvider;
