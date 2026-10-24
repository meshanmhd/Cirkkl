import { describe, it, expect, beforeEach } from "vitest";
import { createContainer } from "../src/container";

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
  });
});
