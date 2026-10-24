"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface AuthUserRecord {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AuthContextType {
  user: AuthUserRecord | null;
  role: string | null;
  org: { isOtpVerified: boolean; isApproved: boolean } | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  org: null,
  loading: true,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserRecord | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [org, setOrg] = useState<{ isOtpVerified: boolean; isApproved: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser({
        id: me.userId,
        email: me.email,
        role: me.role,
        user_metadata: {
          full_name: me.user?.name || (me.role === "organisation" ? "Organisation" : undefined),
        },
        ...me.user,
      });
      setRole(me.role);
      setOrg(me.org || null);
    } catch {
      setUser(null);
      setRole(null);
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api.auth.me()
      .then((me) => {
        if (ignore) return;
        setUser({
          id: me.userId,
          email: me.email,
          role: me.role,
          user_metadata: {
            full_name: me.user?.name || (me.role === "organisation" ? "Organisation" : undefined),
          },
          ...me.user,
        });
        setRole(me.role);
        setOrg(me.org || null);
      })
      .catch(() => {
        if (ignore) return;
        setUser(null);
        setRole(null);
        setOrg(null);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, org, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
