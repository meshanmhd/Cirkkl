import { randomInt } from "crypto";
import { AuthProvider } from "../ports/auth.provider";
import { OrganisationRepo, ProfileRepo } from "../ports/repositories";
import { UserRole } from "../ports/domain";
import { badRequest, tooManyRequests } from "../errors";
import { RateLimiter } from "./rate-limiter";
import { encryptOtp } from "../crypto";

export interface CallerContext {
  userId: string;
  email?: string;
  role: UserRole;
  orgId?: string;
  isOrgApproved?: boolean;
}

export class AuthService {
  private readonly rateLimiter = new RateLimiter();

  constructor(
    private readonly authProvider: AuthProvider,
    private readonly orgRepo: OrganisationRepo,
    private readonly profileRepo?: ProfileRepo
  ) {}

  async signup(input: {
    email: string;
    password: string;
    role: UserRole;
    name?: string;
    orgName?: string;
    clientIp?: string;
  }): Promise<{
    userId?: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    user?: {
      id: string;
      email: string;
      name: string;
      role: "member" | "organisation";
    };
    requiresEmailVerification: boolean;
  }> {
    if (input.clientIp) {
      const allowed = this.rateLimiter.check(`ip:signup:${input.clientIp}`, 5, 60000);
      if (!allowed) throw tooManyRequests();
    }
    const emailAllowed = this.rateLimiter.check(`email:signup:${input.email.toLowerCase()}`, 5, 60000);
    if (!emailAllowed) throw tooManyRequests();

    const normalizedRole = input.role === "organisation" || input.role === "organiser" ? "organisation" : "member";

    const res = await this.authProvider.signup({
      email: input.email,
      password: input.password,
      role: normalizedRole === "organisation" ? "organiser" : "attendee",
      metadata: {
        name: input.name,
      },
    });

    if (normalizedRole === "organisation") {
      try {
        const otp = randomInt(100000, 1000000).toString();
        const encryptedOtp = encryptOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.orgRepo.create({
          ownerId: res.userId,
          name: input.orgName || input.name || "Organisation",
          email: input.email,
          status: "pending",
          isOtpVerified: false,
          otp: encryptedOtp,
          otpExpiresAt: expiresAt,
          otpFailedAttempts: 0,
        });
      } catch (err) {
        await this.authProvider.deleteUser(res.userId);
        throw err;
      }
    } else if (this.profileRepo) {
      try {
        await this.profileRepo.create({
          userId: res.userId,
          fullName: input.name || "",
          email: input.email,
          isProfileCompleted: false,
        });
      } catch {}
    }

    return {
      userId: res.userId,
      email: res.email,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAt: res.expiresAt,
      user: {
        id: res.userId,
        email: res.email,
        name: input.name || "",
        role: normalizedRole,
      },
      requiresEmailVerification: !res.accessToken,
    };
  }

  async login(input: {
    email: string;
    password: string;
    clientIp?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: "member" | "organisation";
    };
    orgStatus?: {
      isApproved: boolean;
      isOtpVerified: boolean;
    } | null;
  }> {
    if (input.clientIp) {
      const allowed = this.rateLimiter.check(`ip:login:${input.clientIp}`, 5, 60000);
      if (!allowed) throw tooManyRequests();
    }
    const emailAllowed = this.rateLimiter.check(`email:login:${input.email.toLowerCase()}`, 5, 60000);
    if (!emailAllowed) throw tooManyRequests();

    const res = await this.authProvider.login(input);
    const org = (await this.orgRepo.findById(res.user.id)) ?? (await this.orgRepo.findByOwnerId(res.user.id));

    let orgStatus = null;
    let effectiveRole: "member" | "organisation" = "member";

    if (org) {
      effectiveRole = "organisation";
      orgStatus = {
        isApproved: org.status === "approved",
        isOtpVerified: org.isOtpVerified,
      };
    }

    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAt: res.expiresAt,
      token: res.token,
      user: {
        id: res.user.id,
        email: res.user.email,
        name: "",
        role: effectiveRole,
      },
      orgStatus,
    };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }> {
    return this.authProvider.refresh(refreshToken);
  }

  async logout(token: string): Promise<void> {
    await this.authProvider.logout(token);
  }

  async resendOrgOtp(callerId: string, clientIp?: string): Promise<{ success: boolean }> {
    if (clientIp) {
      const allowed = this.rateLimiter.check(`ip:resend-otp:${clientIp}`, 5, 60000);
      if (!allowed) throw tooManyRequests();
    }
    const userAllowed = this.rateLimiter.check(`user:resend-otp:${callerId}`, 5, 60000);
    if (!userAllowed) throw tooManyRequests();

    const org = (await this.orgRepo.findById(callerId)) ?? (await this.orgRepo.findByOwnerId(callerId));
    if (!org) throw badRequest("Organisation not found");
    if (org.isOtpVerified) throw badRequest("Organisation is already verified");

    const newOtp = randomInt(100000, 1000000).toString();
    const encryptedOtp = encryptOtp(newOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.orgRepo.update(org.id, {
      otp: encryptedOtp,
      otpExpiresAt: expiresAt,
      otpFailedAttempts: 0,
    });

    return { success: true };
  }

  async verifyOrgOtp(callerId: string, otp: string, clientIp?: string): Promise<boolean> {
    if (clientIp) {
      const allowed = this.rateLimiter.check(`ip:otp:${clientIp}`, 5, 60000);
      if (!allowed) throw tooManyRequests();
    }
    const userAllowed = this.rateLimiter.check(`user:otp:${callerId}`, 5, 60000);
    if (!userAllowed) throw tooManyRequests();

    const org = (await this.orgRepo.findById(callerId)) ?? (await this.orgRepo.findByOwnerId(callerId));
    if (!org) {
      throw badRequest("Invalid OTP code");
    }

    const result = await this.orgRepo.verifyOtp(org.id, otp);
    if (!result.success) {
      if (result.reason === "expired") {
        throw badRequest("OTP code has expired. Please request a new OTP");
      }
      if (result.reason === "max_attempts") {
        throw badRequest("Maximum failed attempts exceeded. Please request a new OTP");
      }
      if (result.reason === "not_found") {
        throw badRequest("No active OTP. Please request a new OTP");
      }
      throw badRequest("Invalid OTP code");
    }

    return true;
  }

  async getCaller(token: string): Promise<CallerContext> {
    const { userId, email } = await this.authProvider.verifyToken(token);
    const org = (await this.orgRepo.findById(userId)) ?? (await this.orgRepo.findByOwnerId(userId));

    if (org) {
      return {
        userId,
        email: email ?? org.email,
        role: "organiser",
        orgId: org.id,
        isOrgApproved: org.status === "approved" && org.isOtpVerified,
      };
    }

    return {
      userId,
      email,
      role: "attendee",
    };
  }

  async getMe(userId: string, userEmail?: string): Promise<{
    userId: string;
    email: string | null;
    role: "organisation" | "member";
    org?: {
      name?: string;
      isOtpVerified: boolean;
      isApproved: boolean;
    };
  }> {
    try {
      const org = (await this.orgRepo.findById(userId)) ?? (await this.orgRepo.findByOwnerId(userId));
      if (org) {
        return {
          userId,
          email: userEmail || org.email || null,
          role: "organisation",
          org: {
            name: org.name,
            isOtpVerified: org.isOtpVerified,
            isApproved: org.status === "approved",
          },
        };
      }

      let email = userEmail || "";
      if (!email && this.profileRepo) {
        try {
          const profile = await this.profileRepo.findByUserId(userId);
          if (profile?.email) email = profile.email;
        } catch (profileError) {
          console.error(`Error fetching profile for user ${userId}:`, profileError);
        }
      }

      return {
        userId,
        email: email || null,
        role: "member",
      };
    } catch (error) {
      console.error(`Error in getMe for user ${userId}:`, error);
      return {
        userId,
        email: userEmail || null,
        role: "member",
      };
    }
  }
}
