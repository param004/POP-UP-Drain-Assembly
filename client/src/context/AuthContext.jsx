import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api/endpoints.js";
import { getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `checking` stays true until the initial "am I signed in?" probe resolves, so
  // protected routes never flash the login form for an already-signed-in user.
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    api
      .fetchMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        // Token was rejected — the interceptor has already cleared it.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The axios interceptor fires this when a request comes back 401.
  useEffect(() => {
    const onUnauthorised = () => setUser(null);
    window.addEventListener("premier-products:unauthorised", onUnauthorised);
    return () => window.removeEventListener("premier-products:unauthorised", onUnauthorised);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // A failed logout call must never trap the user in a signed-in shell.
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      setUser,
    }),
    [user, checking, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
