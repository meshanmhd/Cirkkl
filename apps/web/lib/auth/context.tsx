"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

export interface AuthUserRecord {
  id: string;
  email?: string | null;
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
  const pathname = usePathname();

  const refreshAuth = useCallback(async () => {
    try {
      const me = await api.auth.me();
      if (!me) {
        setUser(null);
        setRole(null);
        setOrg(null);
        return;
      }
      setUser({
        id: me.userId,
        role: me.role,
        user_metadata: {
          full_name: me.user?.name || (me.role === "organisation" ? "Organisation" : undefined),
        },
        ...me.user,
        email: me.user?.email || me.email || undefined,
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
    api.auth
      .me()
      .then((me) => {
        if (ignore) return;
        if (!me) {
          setUser(null);
          setRole(null);
          setOrg(null);
          return;
        }
        setUser({
          id: me.userId,
          role: me.role,
          user_metadata: {
            full_name: me.user?.name || (me.role === "organisation" ? "Organisation" : undefined),
          },
          ...me.user,
          email: me.user?.email || me.email || undefined,
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
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      refreshAuth();
    }
  }, [pathname, user, loading, refreshAuth]);

  useEffect(() => {
    const handleFocus = () => {
      if (!user && !loading) {
        refreshAuth();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, loading, refreshAuth]);

  return (
    <AuthContext.Provider value={{ user, role, org, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
