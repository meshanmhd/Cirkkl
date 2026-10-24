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

  addUser(user: UserRecord): void {
    this.users.set(user.id, user);
  }

  async verifyToken(token: string): Promise<{ userId: string }> {
    const userId = this.tokens.get(token);
    if (!userId) {
      throw unauthorized("Invalid token");
    }
    return { userId };
  }

  async signup(params: {
    email: string;
    password: string;
    role: UserRole;
    metadata?: Record<string, unknown>;
  }): Promise<{ userId: string; email: string }> {
    const userId = crypto.randomUUID();
    const user: UserRecord = {
      id: userId,
      email: params.email,
      password: params.password,
      role: params.role,
    };
    this.users.set(userId, user);
    return { userId, email: params.email };
  }

  async login(params: {
    email: string;
    password: string;
  }): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
  }> {
    for (const u of this.users.values()) {
      if (u.email === params.email && u.password === params.password) {
        const token = `token-${u.id}-${Date.now()}`;
        this.tokens.set(token, u.id);
        return {
          token,
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

  async logout(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}
