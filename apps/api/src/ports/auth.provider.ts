import { UserRole } from "./domain";

export interface AuthProvider {
  verifyToken(token: string): Promise<{ userId: string }>;
  signup(params: {
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
  }>;
  login(params: {
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
  }>;
  refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }>;
  deleteUser(userId: string): Promise<void>;
  logout(token: string): Promise<void>;
}
