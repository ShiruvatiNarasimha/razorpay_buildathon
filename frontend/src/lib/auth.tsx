"use client";

// Dev session store. Holds the dev-login JWT + firm context in localStorage so
// the client-side API calls are firm-scoped. Replaced by Supabase Auth later.
import { createContext, useContext, useEffect, useState } from "react";

import { SessionSchema, type Session } from "@/lib/api";

const STORAGE_KEY = "opusgen.session";

type AuthContextValue = {
  session: Session | null;
  ready: boolean;
  setSession: (session: Session) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate the session from localStorage after mount (client-only; deliberately
  // not a lazy initializer, which would cause SSR/hydration mismatches).
  useEffect(() => {
    let restored: Session | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = SessionSchema.parse(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration
    if (restored) setSessionState(restored);
    setReady(true);
  }, []);

  const setSession = (next: Session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSessionState(next);
  };
  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionState(null);
  };

  return (
    <AuthContext.Provider value={{ session, ready, setSession, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
