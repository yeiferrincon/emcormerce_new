import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(Boolean(localStorage.getItem("token")));

  console.log("AuthProvider - Estado inicial:", { token: token ? "existe" : "no existe", user, isAuthReady });
  console.log("AuthProvider - Token en localStorage:", localStorage.getItem("token"));

  useEffect(() => {
    // Asegurar que el header Authorization del API siempre refleje el token actual.
    setAuthToken(token || "");
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);



  async function createGuestSession() {
    try {
      console.log("Creando sesión de invitado...");
      const res = await api.post("/auth/guest");
      console.log("Respuesta de guest:", res.data);
      const guestToken = res.data.token.access_token;
      setAuthToken(guestToken);
      setToken(guestToken);
      setUser(res.data.user);
      setIsLoggedOut(false);
      setIsAuthReady(true);
      console.log("Sesión de invitado creada exitosamente");
      return guestToken;
    } catch (e) {
      console.error("Error al crear sesión de invitado:", e);
      setIsAuthReady(true);
      return "";
    }
  }

  useEffect(() => {
    if (!token && !isLoggedOut) {
      createGuestSession();
    }
  }, [token, isLoggedOut]);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    setToken(res.data.token.access_token);
    setUser(res.data.user);
    setIsLoggedOut(false);
    setIsAuthReady(true);
  }

  async function register(name, email, password) {
    const res = await api.post("/auth/register", { name, email, password });
    setToken(res.data.token.access_token);
    setUser(res.data.user);
    setIsLoggedOut(false);
    setIsAuthReady(true);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken("");
    setUser(null);
    setToken("");
    setIsLoggedOut(true);
    setIsAuthReady(true);
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
  }

  const value = useMemo(
    () => ({ token, user, login, register, logout, updateUser, createGuestSession, isAuthReady }),
    [token, user, isAuthReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

