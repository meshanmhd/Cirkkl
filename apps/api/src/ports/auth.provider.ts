import { UserRole } from "./domain";

export interface AuthProvider {
  verifyToken(token: string): Promise<{ userId: string }>;
  signup(params: {
    email: string;
    password: string;
    role: UserRole;
    metadata?: Record<string, unknown>;
  }): Promise<{ userId: string; email: string }>;
  login(params: {
    email: string;
    password: string;
  }): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
  }>;
  logout(token: string): Promise<void>;
}
