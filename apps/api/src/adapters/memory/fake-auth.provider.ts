import { AuthProvider } from "../../ports/auth.provider";
import { UserRole } from "../../ports/domain";
import { unauthorized } from "../../errors";

interface UserRecord {
  id: string;
  email: string;
  password: string;
  role: UserRole;
}

export class MemoryAuthProvider implements AuthProvider {
  private users: Map<string, UserRecord> = new Map();
  private tokens: Map<string, string> = new Map();
  private refreshTokens: Map<string, string> = new Map();

  addUser(user: UserRecord): void {
    this.users.set(user.id, user);
  }

  async verifyToken(token: string): Promise<{ userId: string; email?: string }> {
    const userId = this.tokens.get(token);
    if (!userId) {
      throw unauthorized("Invalid token");
    }
    const user = this.users.get(userId);
    return { userId, email: user?.email };
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
    const userId = crypto.randomUUID();
    const user: UserRecord = {
      id: userId,
      email: params.email,
      password: params.password,
      role: params.role,
    };
    this.users.set(userId, user);

    const accessToken = `token-${userId}-${Date.now()}`;
    const refreshToken = `refresh-${userId}-${Date.now()}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    this.tokens.set(accessToken, userId);
    this.refreshTokens.set(refreshToken, userId);

    return {
      userId,
      email: params.email,
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
    for (const u of this.users.values()) {
      if (u.email === params.email && u.password === params.password) {
        const accessToken = `token-${u.id}-${Date.now()}`;
        const refreshToken = `refresh-${u.id}-${Date.now()}`;
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;

        this.tokens.set(accessToken, u.id);
        this.refreshTokens.set(refreshToken, u.id);

        return {
          accessToken,
          refreshToken,
          expiresAt,
          token: accessToken,
          user: {
            id: u.id,
            email: u.email,
            role: u.role,
          },
        };
      }
    }
    throw unauthorized("Invalid email or password");
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }> {
    const userId = this.refreshTokens.get(refreshToken);
    if (!userId) {
      throw unauthorized("Invalid refresh token");
    }

    const newAccessToken = `token-${userId}-${Date.now()}`;
    const newRefreshToken = `refresh-${userId}-${Date.now()}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    this.refreshTokens.delete(refreshToken);
    this.tokens.set(newAccessToken, userId);
    this.refreshTokens.set(newRefreshToken, userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
    for (const [t, u] of this.tokens.entries()) {
      if (u === userId) this.tokens.delete(t);
    }
    for (const [rt, u] of this.refreshTokens.entries()) {
      if (u === userId) this.refreshTokens.delete(rt);
    }
  }

  async logout(token: string): Promise<void> {
    const userId = this.tokens.get(token);
    this.tokens.delete(token);
    if (userId) {
      for (const [rt, u] of this.refreshTokens.entries()) {
        if (u === userId) this.refreshTokens.delete(rt);
      }
    }
  }
}
