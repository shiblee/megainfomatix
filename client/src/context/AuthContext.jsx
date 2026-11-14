/**
 * Global authentication state. Consume it through the useAuth() hook.
 * The JWT is kept in localStorage via tokenStore; on load the current user is
 * restored with GET /auth/me.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { tokenStore, UNAUTHORIZED_EVENT } from '../services/api';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStore.get()));

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    const controller = new AbortController();

    authService
      .me({ signal: controller.signal })
      .then(setUser)
      .catch((error) => {
        if (error.name !== 'AbortError') tokenStore.clear();
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Any 401 from the API (expired/revoked token) signs the user out.
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const startSession = useCallback(({ user: nextUser, token }) => {
    tokenStore.set(token);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession]);
  const register = useCallback(async (details) => startSession(await authService.register(details)), [startSession]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
