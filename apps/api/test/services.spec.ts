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

      await expect(
        services.eventService.deleteEvent(event.id, wrongOrgCaller)
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
  });
});
