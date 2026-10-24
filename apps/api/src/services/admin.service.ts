import { AdminRepo, OrganisationRepo } from "../ports/repositories";
import { badRequest, tooManyRequests } from "../errors";
import { RateLimiter } from "./rate-limiter";
import { decryptOtp } from "../crypto";

export interface GetOrgOtpResult {
  code: string | null;
  legacy: boolean;
  message?: string;
  expiresAt?: Date | null;
  failedAttempts: number;
}

export class AdminService {
  private readonly rateLimiter = new RateLimiter();

  constructor(
    private readonly adminRepo: AdminRepo,
    private readonly orgRepo: OrganisationRepo
  ) {}

  async getOrgOtp(adminId: string, orgId: string, clientIp?: string): Promise<GetOrgOtpResult> {
    if (clientIp) {
      const allowed = this.rateLimiter.check(`ip:admin-otp:${clientIp}`, 10, 60000);
      if (!allowed) throw tooManyRequests();
    }
    const adminAllowed = this.rateLimiter.check(`admin:otp:${adminId}`, 10, 60000);
    if (!adminAllowed) throw tooManyRequests();

    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      throw badRequest("Organisation not found");
    }

    if (org.isOtpVerified) {
      throw badRequest("Organisation is already verified");
    }

    await this.adminRepo.logAudit({
      adminUserId: adminId,
      action: "get_org_otp",
      targetOrgId: org.id,
    });

    if (!org.otp) {
      throw badRequest("No OTP code exists for this organisation");
    }

    if (!org.otp.startsWith("v1:")) {
      return {
        code: null,
        legacy: true,
        message: "legacy code, ask the org to request a new one",
        expiresAt: org.otpExpiresAt,
        failedAttempts: org.otpFailedAttempts ?? 0,
      };
    }

    const code = decryptOtp(org.otp);
    return {
      code,
      legacy: false,
      expiresAt: org.otpExpiresAt,
      failedAttempts: org.otpFailedAttempts ?? 0,
    };
  }
}
