import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHmac } from "crypto";
import { createContainer } from "../src/container";
import { AuthService } from "../src/services/auth.service";
import { encryptOtp, decryptOtp, verifyLegacyHmac, getOtpSecret } from "../src/crypto";
import { validateProductionSecrets } from "../src/config/env";
import { createAuthRoutes } from "../src/routes/auth.routes";

function hasKeyRecursive(obj: unknown, key: string): boolean {
  if (!obj || typeof obj !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return true;
  for (const value of Object.values(obj)) {
    if (hasKeyRecursive(value, key)) return true;
  }
  return false;
}

describe("API Service Layer Tests", () => {
  let container: ReturnType<typeof createContainer>;

  beforeEach(() => {
    container = createContainer("memory");
  });

  describe("registerForEvent", () => {
    it("should register a solo attendee successfully", async () => {
      const { services, ports } = container;

      const event = await ports.eventRepo.create({
        organisationId: "org-1",
        title: "Test Tech Meetup",
        slug: "test-meetup",
        description: "A tech meetup",
        startDate: new Date(Date.now() + 86400000),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: false,
        isTeamEvent: false,
      });

      const caller = { userId: "user-1", role: "attendee" as const };

      const res = await services.registrationService.registerForEvent(
        {
          eventId: event.id,
          isTeamEvent: false,
        },
        caller
      );

      expect(res.registrationId).toBeDefined();
      expect(res.status).toBe("approved");
      expect(res.ticketCode).toMatch(/^CRK-[A-Z0-9]+$/);

      const reg = await ports.registrationRepo.findById(res.registrationId);
      expect(reg).toBeDefined();
      expect(reg?.userId).toBe("user-1");
      expect(reg?.eventId).toBe(event.id);
    });

    it("should register a team and invite teammates", async () => {
      const { services, ports } = container;

      const event = await ports.eventRepo.create({
        organisationId: "org-1",
        title: "Hackathon",
        slug: "hackathon",
        description: "A team hackathon",
        startDate: new Date(Date.now() + 86400000),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: false,
        isTeamEvent: true,
      });

      const caller = { userId: "leader-1", role: "attendee" as const };

      const res = await services.registrationService.registerForEvent(
        {
          eventId: event.id,
          isTeamEvent: true,
          teamName: "Code Warriors",
          teamMates: [{ id: "teammate-1", name: "Alice" }],
        },
        caller
      );

      expect(res.status).toBe("approved");

      const leaderReg = await ports.registrationRepo.findById(res.registrationId);
      expect(leaderReg?.teamId).toBeDefined();

      const members = await ports.teamRepo.findMembers(leaderReg!.teamId!);
      expect(members.length).toBe(1);
      expect(members[0].userId).toBe("teammate-1");
      expect(members[0].status).toBe("pending");

      const notifs = await ports.notificationRepo.findByUser("teammate-1");
      expect(notifs.items.length).toBe(1);
      expect(notifs.items[0].type).toBe("team_invite");
    });

    it("should allow re-registering when previous registration was rejected", async () => {
      const { services, ports } = container;

      const event = await ports.eventRepo.create({
        organisationId: "org-1",
        title: "Summit",
        slug: "summit",
        description: "A summit",
        startDate: new Date(Date.now() + 86400000),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: false,
        isTeamEvent: false,
      });

      const initial = await ports.registrationRepo.create({
        eventId: event.id,
        userId: "user-re",
        ticketCode: "CRK-EXISTING",
        status: "rejected",
        attended: false,
        isTeam: false,
      });

      const caller = { userId: "user-re", role: "attendee" as const };

      const res = await services.registrationService.registerForEvent(
        {
          eventId: event.id,
          isTeamEvent: false,
        },
        caller
      );

      expect(res.registrationId).toBe(initial.id);
      expect(res.ticketCode).toBe("CRK-EXISTING");
      expect(res.status).toBe("approved");
    });

    it("should rollback transaction if error occurs during registration", async () => {
      const { services, ports } = container;

      const event = await ports.eventRepo.create({
        organisationId: "org-1",
        title: "Closed Conference",
        slug: "closed-conf",
        description: "Closed",
        startDate: new Date(Date.now() - 100000),
        registrationDeadline: new Date(Date.now() - 50000),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: false,
        isTeamEvent: false,
      });

      const caller = { userId: "user-late", role: "attendee" as const };

      await expect(
        services.registrationService.registerForEvent(
          {
            eventId: event.id,
            isTeamEvent: false,
          },
          caller
        )
      ).rejects.toThrow("Registration for this event is closed");

      const reg = await ports.registrationRepo.findByUserAndEvent("user-late", event.id);
      expect(reg).toBeNull();
    });
  });

  describe("approve, reject, cancel registration", () => {
    it("should allow organisation owner to approve, reject and cancel a registration", async () => {
      const { services, ports } = container;

      const org = await ports.orgRepo.create({
        ownerId: "org-owner-1",
        name: "Acme Org",
        email: "org@acme.com",
        status: "approved",
        isOtpVerified: true,
      });

      const event = await ports.eventRepo.create({
        organisationId: org.id,
        title: "Keynote",
        slug: "keynote",
        description: "Keynote event",
        startDate: new Date(Date.now() + 86400000),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: true,
        isTeamEvent: false,
      });

      const reg = await ports.registrationRepo.create({
        eventId: event.id,
        userId: "attendee-1",
        ticketCode: "CRK-TEST",
        status: "pending",
        attended: false,
        isTeam: false,
      });

      const orgCaller = {
        userId: org.ownerId,
        role: "organiser" as const,
        orgId: org.id,
        isOrgApproved: true,
      };

      const approvedRes = await services.orgService.approveRegistration(event.id, reg.id, orgCaller);
      expect(approvedRes.status).toBe("approved");

      let updated = await ports.registrationRepo.findById(reg.id);
      expect(updated?.status).toBe("approved");

      const rejectedRes = await services.orgService.rejectRegistration(event.id, reg.id, orgCaller);
      expect(rejectedRes.status).toBe("rejected");

      updated = await ports.registrationRepo.findById(reg.id);
      expect(updated?.status).toBe("rejected");

      const cancelledRes = await services.orgService.cancelRegistration(event.id, reg.id, orgCaller);
      expect(cancelledRes.status).toBe("cancelled");

      updated = await ports.registrationRepo.findById(reg.id);
      expect(updated?.status).toBe("cancelled");
    });
  });

  describe("attendance scan and confirm", () => {
    it("should scan ticket and confirm attendance", async () => {
      const { services, ports } = container;

      const org = await ports.orgRepo.create({
        ownerId: "org-scan-owner",
        name: "Scan Org",
        email: "scan@org.com",
        status: "approved",
        isOtpVerified: true,
      });

      const event = await ports.eventRepo.create({
        organisationId: org.id,
        title: "Live Concert",
        slug: "live-concert",
        description: "Music concert",
        startDate: new Date(),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: false,
        isTeamEvent: false,
      });

      await ports.profileRepo.create({
        userId: "attendee-scan",
        email: "user@scan.com",
        fullName: "Jane Doe",
        cklId: "CKL-9999",
        isProfileCompleted: true,
      });

      const reg = await ports.registrationRepo.create({
        eventId: event.id,
        userId: "attendee-scan",
        ticketCode: "CRK-SCAN-123",
        status: "approved",
        attended: false,
        isTeam: false,
      });

      const orgCaller = {
        userId: org.ownerId,
        role: "organiser" as const,
        orgId: org.id,
        isOrgApproved: true,
      };

      const scanResult = await services.orgService.scanAttendance(event.id, "CRK-SCAN-123", orgCaller);
      expect(scanResult.registrationId).toBe(reg.id);
      expect(scanResult.attended).toBe(false);
      expect(scanResult.participant.name).toBe("Jane Doe");

      const confirmResult = await services.orgService.confirmAttendance(event.id, reg.id, orgCaller);
      expect(confirmResult.attended).toBe(true);
      expect(confirmResult.attendedAt).toBeDefined();

      const regAfter = await ports.registrationRepo.findById(reg.id);
      expect(regAfter?.attended).toBe(true);

      await expect(
        services.orgService.confirmAttendance(event.id, reg.id, orgCaller)
      ).rejects.toThrow("Attendee has already been checked in");
    });
  });

  describe("authorization failures", () => {
    it("should fail when unauthorized user attempts org operations", async () => {
      const { services, ports } = container;

      const event = await ports.eventRepo.create({
        organisationId: "real-org",
        title: "Private Meeting",
        slug: "private-meeting",
        description: "Restricted",
        startDate: new Date(),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: false,
        isTeamEvent: false,
      });

      const wrongOrgCaller = {
        userId: "hacker",
        role: "organiser" as const,
        orgId: "wrong-org",
        isOrgApproved: true,
      };

      const reg = await ports.registrationRepo.create({
        eventId: event.id,
        userId: "target-user",
        ticketCode: "CRK-RESTRICTED-1",
        status: "pending",
        attended: false,
        isTeam: false,
      });

      await expect(
        services.eventService.deleteEvent(event.id, wrongOrgCaller)
      ).rejects.toThrow("You do not own this event");

      await expect(
        services.orgService.approveRegistration(event.id, reg.id, wrongOrgCaller)
      ).rejects.toThrow("You do not own this event");

      await expect(
        services.orgService.rejectRegistration(event.id, reg.id, wrongOrgCaller)
      ).rejects.toThrow("You do not own this event");

      await expect(
        services.orgService.scanAttendance(event.id, "CRK-RESTRICTED-1", wrongOrgCaller)
      ).rejects.toThrow("You do not own this event");

      const attendeeCaller = {
        userId: "regular-user",
        role: "attendee" as const,
      };

      await expect(
        services.eventService.createEvent(
          {
            title: "Illegitimate Event",
            description: "No org permission",
            category: "General",
            imageKey: "key.jpg",
            date: new Date().toISOString(),
          },
          attendeeCaller
        )
      ).rejects.toThrow("Approved organisation required to create events");
    });

    it("approving twice is safe (idempotent)", async () => {
      const { services, ports } = container;

      const org = await ports.orgRepo.create({
        ownerId: "owner-idemp",
        name: "Idemp Org",
        email: "idemp@org.com",
        status: "approved",
        isOtpVerified: true,
      });

      const event = await ports.eventRepo.create({
        organisationId: org.id,
        title: "Idemp Event",
        slug: "idemp-event",
        description: "Testing idempotency",
        startDate: new Date(),
        status: "published",
        visibility: "public",
        isFeatured: false,
        isPaid: false,
        isTeamEvent: false,
      });

      const reg = await ports.registrationRepo.create({
        eventId: event.id,
        userId: "user-idemp",
        ticketCode: "CRK-IDEMP-1",
        status: "pending",
        attended: false,
        isTeam: false,
      });

      const orgCaller = {
        userId: org.ownerId,
        role: "organiser" as const,
        orgId: org.id,
        isOrgApproved: true,
      };

      const firstApprove = await services.orgService.approveRegistration(event.id, reg.id, orgCaller);
      expect(firstApprove.status).toBe("approved");

      const secondApprove = await services.orgService.approveRegistration(event.id, reg.id, orgCaller);
      expect(secondApprove.status).toBe("approved");

      const notifications = await ports.notificationRepo.findByUser("user-idemp");
      expect(notifications.items.length).toBe(1);
    });

    it("ticket-tier diff handles adding, modifying and deleting tiers with and without registrations", async () => {
      const { services, ports } = container;

      const org = await ports.orgRepo.create({
        ownerId: "owner-diff",
        name: "Diff Org",
        email: "diff@org.com",
        status: "approved",
        isOtpVerified: true,
      });

      const orgCaller = {
        userId: org.ownerId,
        role: "organiser" as const,
        orgId: org.id,
        isOrgApproved: true,
      };

      const created = await services.eventService.createEvent(
        {
          title: "Tier Event",
          description: "Tier diff test",
          date: new Date().toISOString(),
          price: "paid",
          tickets: [
            { name: "Early Bird", price: 100, quantity: 50 },
            { name: "Regular", price: 200, quantity: 100 },
          ],
        },
        orgCaller
      );

      const initialTickets = await ports.ticketRepo.findByEventId(created.id);
      expect(initialTickets.length).toBe(2);
      const earlyBird = initialTickets.find((t) => t.name === "Early Bird")!;
      const regular = initialTickets.find((t) => t.name === "Regular")!;

      const updateRes1 = await services.eventService.updateEvent(
        created.id,
        {
          tickets: [
            { id: earlyBird.id, name: "Early Bird VIP", price: 120, quantity: 40 },
            { name: "Student", price: 50, quantity: 30 },
          ],
        },
        orgCaller
      );

      const afterDiff1 = await ports.ticketRepo.findByEventId(created.id);
      expect(afterDiff1.length).toBe(2);
      expect(afterDiff1.some((t) => t.name === "Early Bird VIP")).toBe(true);
      expect(afterDiff1.some((t) => t.name === "Student")).toBe(true);
      expect(afterDiff1.some((t) => t.id === regular.id)).toBe(false);

      const studentTicket = afterDiff1.find((t) => t.name === "Student")!;
      await ports.registrationRepo.create({
        eventId: created.id,
        userId: "student-user",
        ticketCode: "CRK-STUDENT-1",
        ticketId: studentTicket.id,
        status: "approved",
        attended: false,
        isTeam: false,
      });

      await expect(
        services.eventService.updateEvent(
          created.id,
          {
            tickets: [
              { id: earlyBird.id, name: "Early Bird VIP", price: 120, quantity: 40 },
            ],
          },
          orgCaller
        )
      ).rejects.toThrow(`Cannot delete ticket tier 'Student' as it has existing registrations or payments`);
    });
  });

  describe("profileService", () => {
    it("should compute isProfileCompleted only when all required fields are present", async () => {
      const { services, ports } = container;
      const caller = { userId: "user-profile-1", role: "attendee" as const };

      await ports.profileRepo.create({
        userId: caller.userId,
        email: "user1@example.com",
        isProfileCompleted: false,
      });

      const partialRes = await services.profileService.updateProfile(
        { bio: "Just a short bio" },
        caller
      );
      expect(partialRes.profile.isProfileCompleted).toBe(false);

      const completeRes = await services.profileService.updateProfile(
        {
          fullName: "Jane Doe",
          college: "MIT",
          branch: "CS",
          academicYear: "4",
          phoneNumber: "+919876543210",
          gender: "Female",
        },
        caller
      );
      expect(completeRes.profile.isProfileCompleted).toBe(true);
    });

    it("should reject avatar key that does not start with profiles/<userId>/", async () => {
      const { services, ports } = container;
      const caller = { userId: "user-profile-2", role: "attendee" as const };

      await ports.profileRepo.create({
        userId: caller.userId,
        email: "user2@example.com",
        isProfileCompleted: false,
      });

      await expect(
        services.profileService.updateAvatar("other-folder/avatar.png", caller)
      ).rejects.toThrow(`Avatar key must start with profiles/${caller.userId}/`);

      await expect(
        services.profileService.updateAvatar(`profiles/victim-id/avatar.png`, caller)
      ).rejects.toThrow(`Avatar key must start with profiles/${caller.userId}/`);

      const validRes = await services.profileService.updateAvatar(
        `profiles/${caller.userId}/my-avatar.png`,
        caller
      );
      expect(validRes.avatarUrl).toBeDefined();
    });
  });

  describe("authService", () => {
    it("compensates and deletes auth user if organisation creation fails during signup", async () => {
      const { services, ports } = container;

      const originalCreate = ports.orgRepo.create;
      ports.orgRepo.create = async () => {
        throw new Error("DB failure on organisation create");
      };

      await expect(
        services.authService.signup({
          email: "compensate@org.com",
          password: "password123",
          role: "organisation",
          orgName: "Failed Org",
        })
      ).rejects.toThrow("DB failure on organisation create");

      ports.orgRepo.create = originalCreate;

      await expect(
        services.authService.login({
          email: "compensate@org.com",
          password: "password123",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("enforces rate limiting on login, signup, and verifyOrgOtp", async () => {
      const { services } = container;

      for (let i = 0; i < 5; i++) {
        await services.authService.signup({
          email: `ratelimit-signup-${i}@test.com`,
          password: "password123",
          role: "member",
          clientIp: "192.168.1.100",
        });
      }

      await expect(
        services.authService.signup({
          email: "ratelimit-signup-blocked@test.com",
          password: "password123",
          role: "member",
          clientIp: "192.168.1.100",
        })
      ).rejects.toThrow("Too many requests. Please try again later.");

      for (let i = 0; i < 5; i++) {
        try {
          await services.authService.login({
            email: "target-user@login.com",
            password: "wrong-password",
            clientIp: `10.0.0.${i}`,
          });
        } catch (e: any) {
          if (e.message?.includes("Too many")) throw e;
        }
      }

      await expect(
        services.authService.login({
          email: "target-user@login.com",
          password: "wrong-password",
          clientIp: "10.0.0.99",
        })
      ).rejects.toThrow("Too many requests. Please try again later.");

      for (let i = 0; i < 5; i++) {
        try {
          await services.authService.verifyOrgOtp("caller-1", "0000", "172.16.0.1");
        } catch (e: any) {
          if (e.message?.includes("Too many")) throw e;
        }
      }

      await expect(
        services.authService.verifyOrgOtp("caller-1", "0000", "172.16.0.1")
      ).rejects.toThrow("Too many requests. Please try again later.");
    });

    it("supports token refresh", async () => {
      const { services } = container;

      const signupRes = await services.authService.signup({
        email: "refresh-user@test.com",
        password: "password123",
        role: "member",
      });

      expect(signupRes.refreshToken).toBeDefined();

      const refreshRes = await services.authService.refresh(signupRes.refreshToken!);
      expect(refreshRes.accessToken).toBeDefined();
      expect(refreshRes.refreshToken).toBeDefined();
      expect(refreshRes.expiresAt).toBeGreaterThan(0);
    });

    it("generates a 6-digit org OTP on signup, stores it encrypted in DB without leaking in return values, and verifies it", async () => {
      const { services, ports } = container;

      const signupRes = await services.authService.signup({
        email: "org-otp-success@test.com",
        password: "password123",
        role: "organisation",
        orgName: "OTP Test Org",
      });

      expect(hasKeyRecursive(signupRes, "otp")).toBe(false);

      const org = await ports.orgRepo.findById(signupRes.userId!);
      expect(org).toBeDefined();
      expect(org!.otp?.startsWith("v1:")).toBe(true);
      expect(org!.otpExpiresAt).toBeDefined();
      expect(org!.otpFailedAttempts).toBe(0);

      const code = decryptOtp(org!.otp!);
      expect(code).toMatch(/^\d{6}$/);

      const freshAuthService = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
      const verified = await freshAuthService.verifyOrgOtp(signupRes.userId!, code);
      expect(verified).toBe(true);

      const updatedOrg = await ports.orgRepo.findById(signupRes.userId!);
      expect(updatedOrg!.isOtpVerified).toBe(true);
      expect(updatedOrg!.otp).toBeNull();
      expect(updatedOrg!.otpExpiresAt).toBeNull();
      expect(updatedOrg!.otpFailedAttempts).toBe(0);
    });

    it("rejects OTP after 10-minute expiry and requires a new OTP across AuthService re-instantiations", async () => {
      vi.useFakeTimers();
      try {
        const { services, ports } = container;

        const signupRes = await services.authService.signup({
          email: "org-otp-expire@test.com",
          password: "password123",
          role: "organisation",
          orgName: "Expire Org",
        });

        const org = await ports.orgRepo.findById(signupRes.userId!);
        const rawOtp = decryptOtp(org!.otp!);

        vi.advanceTimersByTime(10 * 60 * 1000 + 1000);

        const freshAuthService = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        await expect(
          freshAuthService.verifyOrgOtp(signupRes.userId!, rawOtp)
        ).rejects.toThrow("OTP code has expired. Please request a new OTP");

        const resendRes = await freshAuthService.resendOrgOtp(signupRes.userId!);
        expect(resendRes.success).toBe(true);
        expect(hasKeyRecursive(resendRes, "otp")).toBe(false);

        const refreshedOrg = await ports.orgRepo.findById(signupRes.userId!);
        expect(refreshedOrg!.otp?.startsWith("v1:")).toBe(true);
        expect(refreshedOrg!.otpFailedAttempts).toBe(0);
        const newCode = decryptOtp(refreshedOrg!.otp!);

        const restartAuthService = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        const verified = await restartAuthService.verifyOrgOtp(signupRes.userId!, newCode);
        expect(verified).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it("enforces max of 10 failed attempts across new AuthService instances then requires a new OTP", async () => {
      vi.useFakeTimers();
      try {
        const { services, ports } = container;

        const signupRes = await services.authService.signup({
          email: "org-otp-attempts@test.com",
          password: "password123",
          role: "organisation",
          orgName: "Attempts Org",
        });

        const org = await ports.orgRepo.findById(signupRes.userId!);
        const correctOtp = decryptOtp(org!.otp!);

        for (let i = 0; i < 9; i++) {
          if (i > 0 && i % 4 === 0) {
            vi.advanceTimersByTime(65000);
          }
          const instance = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
          await expect(
            instance.verifyOrgOtp(signupRes.userId!, "000000")
          ).rejects.toThrow("Invalid OTP code");
        }

        vi.advanceTimersByTime(65000);
        const instance10 = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        await expect(
          instance10.verifyOrgOtp(signupRes.userId!, "000000")
        ).rejects.toThrow("Maximum failed attempts exceeded. Please request a new OTP");

        vi.advanceTimersByTime(65000);
        const freshInstance = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        await expect(
          freshInstance.verifyOrgOtp(signupRes.userId!, correctOtp)
        ).rejects.toThrow("Maximum failed attempts exceeded. Please request a new OTP");

        const resendRes = await freshInstance.resendOrgOtp(signupRes.userId!);
        expect(resendRes.success).toBe(true);
        expect(hasKeyRecursive(resendRes, "otp")).toBe(false);

        const refreshedOrg = await ports.orgRepo.findById(signupRes.userId!);
        expect(refreshedOrg!.otpFailedAttempts).toBe(0);
        const newOtp = decryptOtp(refreshedOrg!.otp!);

        const anotherInstance = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        const verified = await anotherInstance.verifyOrgOtp(signupRes.userId!, newOtp);
        expect(verified).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it("crypto round-trips correctly, rejects tampered ciphertext and wrong key, and verifies legacy HMAC", async () => {
      const plain = "738291";
      const encrypted = encryptOtp(plain);
      expect(encrypted.startsWith("v1:")).toBe(true);
      expect(decryptOtp(encrypted)).toBe(plain);

      const parts = encrypted.split(":");
      const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${Buffer.from("tampered").toString("base64")}`;
      expect(() => decryptOtp(tampered)).toThrow();

      const wrongSecret = "another-secret-at-least-32-chars-long";
      expect(() => decryptOtp(encrypted, wrongSecret)).toThrow();

      const secret = getOtpSecret();
      const legacyHmac = createHmac("sha256", secret).update("123456").digest("hex");
      expect(verifyLegacyHmac("123456", legacyHmac)).toBe(true);
      expect(verifyLegacyHmac("654321", legacyHmac)).toBe(false);

      const { ports } = container;
      const legacyOrg = await ports.orgRepo.create({
        ownerId: "legacy-org-user",
        name: "Legacy Org",
        email: "legacy@org.com",
        status: "pending",
        isOtpVerified: false,
        otp: legacyHmac,
        otpExpiresAt: new Date(Date.now() + 600000),
        otpFailedAttempts: 0,
      });

      const verifyRes = await ports.orgRepo.verifyOtp(legacyOrg.id, "123456");
      expect(verifyRes.success).toBe(true);
    });

    it("ensures signup and resend routes never contain otp field in JSON body", async () => {
      const app = container.app;
      const signupRes = await app.request("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "no-leak-org@test.com",
          password: "password123",
          name: "No Leak",
          orgName: "No Leak Org",
          role: "organisation",
        }),
      });

      expect(signupRes.status).toBe(201);
      const signupBody = await signupRes.json();
      expect(hasKeyRecursive(signupBody, "otp")).toBe(false);

      const token = signupBody.accessToken;
      const resendRes = await app.request("/api/v1/auth/resend-org-otp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      expect(resendRes.status).toBe(200);
      const resendBody = await resendRes.json();
      expect(hasKeyRecursive(resendBody, "otp")).toBe(false);
    });

    it("resend resets attempts and expiry, rejects verified orgs, and enforces rate limit", async () => {
      const { services, ports } = container;
      const signupRes = await services.authService.signup({
        email: "resend-test@org.com",
        password: "password123",
        role: "organisation",
        orgName: "Resend Test Org",
      });

      const orgId = signupRes.userId!;
      await ports.orgRepo.update(orgId, { otpFailedAttempts: 8 });

      const resendRes = await services.authService.resendOrgOtp(orgId);
      expect(resendRes.success).toBe(true);

      const refreshed = await ports.orgRepo.findById(orgId);
      expect(refreshed!.otpFailedAttempts).toBe(0);
      expect(refreshed!.otpExpiresAt!.getTime()).toBeGreaterThan(Date.now());

      await ports.orgRepo.update(orgId, { isOtpVerified: true });
      await expect(services.authService.resendOrgOtp(orgId)).rejects.toThrow("Organisation is already verified");

      const unverified = await services.authService.signup({
        email: "rate-resend@org.com",
        password: "password123",
        role: "organisation",
        orgName: "Rate Org",
      });

      for (let i = 0; i < 5; i++) {
        await services.authService.resendOrgOtp(unverified.userId!);
      }
      await expect(services.authService.resendOrgOtp(unverified.userId!)).rejects.toThrow();
    });

    it("admin endpoint enforces auth levels, audit logging, unverified-only, and legacy message", async () => {
      const app = container.app;
      const { ports, services } = container;

      const orgSignup = await services.authService.signup({
        email: "admin-view@org.com",
        password: "password123",
        role: "organisation",
        orgName: "Admin View Org",
      });
      const orgId = orgSignup.userId!;
      const orgToken = orgSignup.accessToken!;

      const memberSignup = await services.authService.signup({
        email: "regular-member@test.com",
        password: "password123",
        role: "member",
        name: "Member User",
      });
      const memberToken = memberSignup.accessToken!;

      const unauthRes = await app.request(`/api/v1/admin/organisations/${orgId}/otp`);
      expect(unauthRes.status).toBe(401);

      const memberRes = await app.request(`/api/v1/admin/organisations/${orgId}/otp`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      expect(memberRes.status).toBe(403);

      const orgRes = await app.request(`/api/v1/admin/organisations/${orgId}/otp`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect(orgRes.status).toBe(403);

      const adminUser = await ports.authProvider.signup({
        email: "superadmin@platform.com",
        password: "password123",
        role: "attendee",
      });
      await ports.adminRepo.addPlatformAdmin(adminUser.userId);

      const adminLogin = await services.authService.login({
        email: "superadmin@platform.com",
        password: "password123",
      });
      const adminToken = adminLogin.accessToken;

      const successRes = await app.request(`/api/v1/admin/organisations/${orgId}/otp`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(successRes.status).toBe(200);
      const data = await successRes.json();
      expect(data.code).toMatch(/^\d{6}$/);
      expect(data.legacy).toBe(false);

      expect(ports.adminRepo.auditLogs.length).toBeGreaterThan(0);
      const audit = ports.adminRepo.auditLogs[ports.adminRepo.auditLogs.length - 1];
      expect(audit.action).toBe("get_org_otp");
      expect(audit.targetOrgId).toBe(orgId);
      expect(audit.adminUserId).toBe(adminUser.userId);

      const legacyOrg = await ports.orgRepo.create({
        ownerId: "legacy-admin-org",
        name: "Legacy Admin Org",
        email: "legacyadmin@org.com",
        status: "pending",
        isOtpVerified: false,
        otp: "a".repeat(64),
        otpExpiresAt: new Date(Date.now() + 600000),
        otpFailedAttempts: 0,
      });

      const legacyRes = await app.request(`/api/v1/admin/organisations/${legacyOrg.id}/otp`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(legacyRes.status).toBe(200);
      const legacyData = await legacyRes.json();
      expect(legacyData.legacy).toBe(true);
      expect(legacyData.message).toBe("legacy code, ask the org to request a new one");

      await ports.orgRepo.update(orgId, { isOtpVerified: true });
      const verifiedRes = await app.request(`/api/v1/admin/organisations/${orgId}/otp`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(verifiedRes.status).toBe(400);
    });

    it("fails production startup validation without strong secrets", () => {
      expect(() =>
        validateProductionSecrets({
          NODE_ENV: "production",
          OTP_SECRET: undefined,
          INTERNAL_PROXY_SECRET: "strong-proxy-secret-with-more-than-32-chars",
        })
      ).toThrow();

      expect(() =>
        validateProductionSecrets({
          NODE_ENV: "production",
          OTP_SECRET: "short",
          INTERNAL_PROXY_SECRET: "strong-proxy-secret-with-more-than-32-chars",
        })
      ).toThrow();

      expect(() =>
        validateProductionSecrets({
          NODE_ENV: "production",
          OTP_SECRET: "cirkkl-otp-hmac-secret-min-32-chars",
          INTERNAL_PROXY_SECRET: "strong-proxy-secret-with-more-than-32-chars",
        })
      ).toThrow();

      expect(() =>
        validateProductionSecrets({
          NODE_ENV: "production",
          OTP_SECRET: "valid-production-secret-with-over-32-characters",
          INTERNAL_PROXY_SECRET: "cirkkl-shared-proxy-secret",
        })
      ).toThrow();

      expect(() =>
        validateProductionSecrets({
          NODE_ENV: "production",
          OTP_SECRET: "valid-production-secret-with-over-32-characters",
          INTERNAL_PROXY_SECRET: "valid-proxy-secret-with-over-32-characters",
        })
      ).not.toThrow();
    });

    it("accepts client IP only with valid INTERNAL_PROXY_SECRET and uses last entry", async () => {
      const originalSecret = process.env.INTERNAL_PROXY_SECRET;
      process.env.INTERNAL_PROXY_SECRET = "secret-test-key";

      try {
        const app = container.app;

        for (let i = 0; i < 6; i++) {
          const res = await app.request("/api/v1/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "203.0.113.5",
            },
            body: JSON.stringify({
              email: `untrusted-${i}@test.com`,
              password: "password123",
              name: `User ${i}`,
              role: "member",
            }),
          });
          expect(res.status).toBe(201);
        }

        for (let i = 0; i < 5; i++) {
          const res = await app.request("/api/v1/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": "10.0.0.1, 198.51.100.99",
              "x-internal-proxy-secret": "secret-test-key",
            },
            body: JSON.stringify({
              email: `trusted-${i}@test.com`,
              password: "password123",
              name: `User ${i}`,
              role: "member",
            }),
          });
          expect(res.status).toBe(201);
        }

        const blockedRes = await app.request("/api/v1/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "10.0.0.1, 198.51.100.99",
            "x-internal-proxy-secret": "secret-test-key",
          },
          body: JSON.stringify({
            email: "trusted-blocked@test.com",
            password: "password123",
            name: "User Blocked",
            role: "member",
          }),
        });
        expect(blockedRes.status).toBe(429);
      } finally {
        process.env.INTERNAL_PROXY_SECRET = originalSecret;
      }
    });
  });
});

