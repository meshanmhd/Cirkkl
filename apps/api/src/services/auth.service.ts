import { AuthProvider } from "../ports/auth.provider";
import { OrganisationRepo } from "../ports/repositories";
import { UserRole } from "../ports/domain";
import { badRequest, unauthorized } from "../errors";

export interface CallerContext {
  userId: string;
  role: UserRole;
  orgId?: string;
  isOrgApproved?: boolean;
}

export class AuthService {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly orgRepo: OrganisationRepo
  ) {}

  async signup(input: {
    email: string;
    password: string;
    role: UserRole;
    name?: string;
    orgName?: string;
  }): Promise<{ userId: string; email: string }> {
    const res = await this.authProvider.signup({
      email: input.email,
      password: input.password,
      role: input.role,
      metadata: {
        name: input.name,
      },
    });

    if (input.role === "organiser" || input.role === "organisation") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.orgRepo.create({
        ownerId: res.userId,
        name: input.orgName || input.name || "Organisation",
        email: input.email,
        status: "pending",
        isOtpVerified: false,
        otp,
      });
    }

    return res;
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
    orgStatus?: {
      isApproved: boolean;
      isOtpVerified: boolean;
    };
  }> {
    const res = await this.authProvider.login(input);
    let orgStatus;

    if (res.user.role === "organiser" || res.user.role === "organisation") {
      const org = await this.orgRepo.findById(res.user.id);
      if (org) {
        orgStatus = {
          isApproved: org.status === "approved",
          isOtpVerified: org.isOtpVerified,
        };
      }
    }

    return {
      ...res,
      orgStatus,
    };
  }

  async logout(token: string): Promise<void> {
    await this.authProvider.logout(token);
  }

  async verifyOrgOtp(callerId: string, otp: string): Promise<boolean> {
    const verified = await this.orgRepo.verifyOtp(callerId, otp);
    if (!verified) {
      throw badRequest("Invalid OTP code");
    }
    return true;
  }

  async getCaller(token: string): Promise<CallerContext> {
    const { userId } = await this.authProvider.verifyToken(token);
    const org = await this.orgRepo.findById(userId);

    if (org) {
      return {
        userId,
        role: "organiser",
        orgId: org.id,
        isOrgApproved: org.status === "approved" && org.isOtpVerified,
      };
    }

    return {
      userId,
      role: "attendee",
    };
  }

  async getMe(caller: CallerContext): Promise<{
    id: string;
    role: UserRole;
    orgId?: string;
    isOrgApproved?: boolean;
  }> {
    return {
      id: caller.userId,
      role: caller.role,
      orgId: caller.orgId,
      isOrgApproved: caller.isOrgApproved,
    };
  }
}
