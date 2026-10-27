import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AuthProvider } from "../../ports/auth.provider";
import { UserRole } from "../../ports/domain";
import { unauthorized, badRequest } from "../../errors";

export class SupabaseAuthProvider implements AuthProvider {
  private readonly client: SupabaseClient;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async verifyToken(token: string): Promise<{ userId: string; email?: string }> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) {
      throw unauthorized("Invalid or expired session token");
    }
    return { userId: data.user.id, email: data.user.email };
  }

  async signup(params: {
    email: string;
    password: string;
    role: UserRole;
    metadata?: Record<string, unknown>;
  }): Promise<{
    userId: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    const { data, error } = await this.client.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        role: params.role,
        ...params.metadata,
      },
    });

    if (error || !data.user) {
      throw badRequest(error?.message || "Failed to create user");
    }

    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    let expiresAt: number | undefined;

    try {
      const signInRes = await this.client.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });
      if (signInRes.data.session) {
        accessToken = signInRes.data.session.access_token;
        refreshToken = signInRes.data.session.refresh_token;
        expiresAt = signInRes.data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;
      }
    } catch {}

    return {
      userId: data.user.id,
      email: data.user.email ?? params.email,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async login(params: {
    email: string;
    password: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    token: string;
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
  }> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error || !data.session || !data.user) {
      throw unauthorized(error?.message || "Invalid email or password");
    }

    const role = (data.user.user_metadata?.role as UserRole) || "attendee";
    const expiresAt = data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt,
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email ?? params.email,
        role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }> {
    const { data, error } = await this.client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw unauthorized(error?.message || "Invalid or expired refresh token");
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.auth.admin.deleteUser(userId);
  }

  async logout(token: string): Promise<void> {
    await this.client.auth.admin.signOut(token);
  }
}
