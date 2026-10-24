import { describe, it, expect, beforeEach, vi } from "vitest";
import { createContainer } from "../src/container";
import { AuthService } from "../src/services/auth.service";
import { hashOtp } from "../src/crypto";
import { createAuthRoutes } from "../src/routes/auth.routes";

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

    it("generates a 6-digit org OTP on signup, stores it hashed in DB, and verifies it within expiry", async () => {
      const { services, ports } = container;

      const signupRes = await services.authService.signup({
        email: "org-otp-success@test.com",
        password: "password123",
        role: "organisation",
        orgName: "OTP Test Org",
      });

      expect(signupRes.otp).toMatch(/^\d{6}$/);

      const org = await ports.orgRepo.findById(signupRes.userId!);
      expect(org).toBeDefined();
      expect(org!.otp).toBe(hashOtp(signupRes.otp!));
      expect(org!.otpExpiresAt).toBeDefined();
      expect(org!.otpFailedAttempts).toBe(0);

      const freshAuthService = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
      const verified = await freshAuthService.verifyOrgOtp(signupRes.userId!, signupRes.otp!);
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

        const rawOtp = signupRes.otp!;

        vi.advanceTimersByTime(10 * 60 * 1000 + 1000);

        const freshAuthService = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        await expect(
          freshAuthService.verifyOrgOtp(signupRes.userId!, rawOtp)
        ).rejects.toThrow("OTP code has expired. Please request a new OTP");

        const resendRes = await freshAuthService.resendOrgOtp(signupRes.userId!);
        expect(resendRes.success).toBe(true);
        expect(resendRes.otp).toMatch(/^\d{6}$/);

        const refreshedOrg = await ports.orgRepo.findById(signupRes.userId!);
        expect(refreshedOrg!.otp).toBe(hashOtp(resendRes.otp!));
        expect(refreshedOrg!.otpFailedAttempts).toBe(0);

        const restartAuthService = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        const verified = await restartAuthService.verifyOrgOtp(signupRes.userId!, resendRes.otp!);
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

        const correctOtp = signupRes.otp!;

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
        expect(resendRes.otp).toMatch(/^\d{6}$/);

        const refreshedOrg = await ports.orgRepo.findById(signupRes.userId!);
        expect(refreshedOrg!.otpFailedAttempts).toBe(0);

        const anotherInstance = new AuthService(ports.authProvider, ports.orgRepo, ports.profileRepo);
        const verified = await anotherInstance.verifyOrgOtp(signupRes.userId!, resendRes.otp!);
        expect(verified).toBe(true);
      } finally {
        vi.useRealTimers();
      }
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

