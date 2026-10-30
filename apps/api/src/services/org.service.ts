import {
  EventRepo,
  MemberRepo,
  NotificationRepo,
  ProfileRepo,
  RegistrationRepo,
  TeamRepo,
  TicketRepo,
  TransactionRunner,
} from "../ports/repositories";
import { CallerContext } from "./auth.service";
import { badRequest, forbidden, notFound } from "../errors";

export class OrgService {
  constructor(
    private readonly eventRepo: EventRepo,
    private readonly registrationRepo: RegistrationRepo,
    private readonly ticketRepo: TicketRepo,
    private readonly teamRepo: TeamRepo,
    private readonly memberRepo: MemberRepo,
    private readonly profileRepo: ProfileRepo,
    private readonly notificationRepo: NotificationRepo,
    private readonly transactionRunner: TransactionRunner
  ) {}

  private async assertOrgOwnsEvent(eventId: string, caller: CallerContext): Promise<void> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const event = (await this.eventRepo.findById(eventId)) ?? (await this.eventRepo.findBySlug(eventId));
    if (!event) {
      throw notFound("Event not found");
    }

    if (event.organisationId !== caller.orgId) {
      throw forbidden("You do not own this event");
    }
  }

  async getEventRegistrations(eventId: string, caller: CallerContext, pagination?: any): Promise<any> {
    await this.assertOrgOwnsEvent(eventId, caller);

    const result = await this.registrationRepo.findByEvent(eventId, undefined, pagination);

    const items = await Promise.all(
      result.items.map(async (reg) => {
        const profile = await this.profileRepo.findByUserId(reg.userId);
        let teamMembers: any[] = [];
        let teamName: string | undefined;

        if (reg.isTeam && reg.teamId) {
          const team = await this.teamRepo.findById(reg.teamId);
          teamName = team?.name;
          const members = await this.teamRepo.findMembers(reg.teamId);
          teamMembers = await Promise.all(
            members.map(async (m) => {
              const p = await this.profileRepo.findByUserId(m.userId);
              return {
                id: m.id,
                userId: m.userId,
                name: p?.fullName || "Teammate",
                email: p?.email || "",
                status: m.status,
                cklId: p?.cklId,
              };
            })
          );
        }

        return {
          id: reg.id,
          userId: reg.userId,
          userName: profile?.fullName || "Participant",
          userEmail: profile?.email || "",
          userPhone: profile?.phoneNumber,
          cklId: profile?.cklId,
          status: reg.status,
          attended: Boolean(reg.attended),
          ticketCode: reg.ticketCode,
          isTeam: reg.isTeam,
          teamId: reg.teamId,
          teamName,
          teamMembers,
          fieldValues: reg.fieldValues || {},
          paymentProofUrl: reg.paymentProofKey || null,
          createdAt: reg.createdAt.toISOString(),
        };
      })
    );

    return {
      items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    };
  }

  async approveRegistration(
    eventId: string,
    registrationId: string,
    caller: CallerContext
  ): Promise<{ success: boolean; registrationId: string; status: "approved" }> {
    await this.assertOrgOwnsEvent(eventId, caller);

    return this.transactionRunner.run(async (uow) => {
      const reg = await uow.registrationRepo.findById(registrationId);
      if (!reg || reg.eventId !== eventId) {
        throw notFound("Registration not found");
      }

      if (reg.status === "approved") {
        return {
          success: true,
          registrationId,
          status: "approved",
        };
      }

      await uow.registrationRepo.update(registrationId, { status: "approved" });

      await uow.notificationRepo.create({
        userId: reg.userId,
        type: "registration_approved",
        title: "Registration Approved",
        message: "Your registration has been approved by the organiser.",
        isRead: false,
        eventId,
      });

      if (reg.isTeam && reg.teamId) {
        const members = await uow.teamRepo.findMembers(reg.teamId);
        for (const m of members) {
          if (m.userId !== reg.userId) {
            await uow.notificationRepo.create({
              userId: m.userId,
              type: "registration_approved",
              title: "Team Registration Approved",
              message: "Your team registration has been approved.",
              isRead: false,
              eventId,
              teamId: reg.teamId,
            });
          }
        }
      }

      return {
        success: true,
        registrationId,
        status: "approved",
      };
    });
  }

  async rejectRegistration(
    eventId: string,
    registrationId: string,
    caller: CallerContext
  ): Promise<{ success: boolean; registrationId: string; status: "rejected" }> {
    await this.assertOrgOwnsEvent(eventId, caller);

    return this.transactionRunner.run(async (uow) => {
      const reg = await uow.registrationRepo.findById(registrationId);
      if (!reg || reg.eventId !== eventId) {
        throw notFound("Registration not found");
      }

      if (reg.status === "rejected") {
        return {
          success: true,
          registrationId,
          status: "rejected",
        };
      }

      await uow.registrationRepo.update(registrationId, { status: "rejected" });

      await uow.notificationRepo.create({
        userId: reg.userId,
        type: "registration_rejected",
        title: "Registration Rejected",
        message: "Your registration was not approved by the organiser.",
        isRead: false,
        eventId,
      });

      if (reg.isTeam && reg.teamId) {
        await uow.notificationRepo.deleteByEventAndTeam(eventId, reg.teamId, "team_invite");
      }

      return {
        success: true,
        registrationId,
        status: "rejected",
      };
    });
  }

  async cancelRegistration(
    eventId: string,
    registrationId: string,
    caller: CallerContext
  ): Promise<{ success: boolean; registrationId: string; status: "cancelled" }> {
    await this.assertOrgOwnsEvent(eventId, caller);

    return this.transactionRunner.run(async (uow) => {
      const reg = await uow.registrationRepo.findById(registrationId);
      if (!reg || reg.eventId !== eventId) {
        throw notFound("Registration not found");
      }

      if (reg.status === "cancelled") {
        return {
          success: true,
          registrationId,
          status: "cancelled",
        };
      }

      await uow.registrationRepo.update(registrationId, { status: "cancelled" });

      if (reg.ticketId) {
        const ticket = await uow.ticketRepo.findById(reg.ticketId);
        if (ticket && ticket.availableQuantity !== null) {
          await uow.ticketRepo.update(ticket.id, {
            availableQuantity: ticket.availableQuantity + 1,
          });
        }
      }

      if (reg.isTeam && reg.teamId) {
        await uow.notificationRepo.deleteByEventAndTeam(eventId, reg.teamId, "team_invite");
      }

      return {
        success: true,
        registrationId,
        status: "cancelled",
      };
    });
  }

  async toggleAttendance(
    eventId: string,
    registrationId: string,
    attended: boolean,
    caller: CallerContext
  ): Promise<{ success: boolean; registrationId: string; attended: boolean }> {
    await this.assertOrgOwnsEvent(eventId, caller);

    const reg = await this.registrationRepo.findById(registrationId);
    if (!reg || reg.eventId !== eventId) {
      throw notFound("Registration not found");
    }

    await this.registrationRepo.update(registrationId, {
      attended,
      attendedAt: attended ? new Date() : null,
    });

    return { success: true, registrationId, attended };
  }

  async getEventRoles(eventId: string, caller: CallerContext): Promise<{ roles: any[]; availableMembers: any[] }> {
    await this.assertOrgOwnsEvent(eventId, caller);

    const [roles, membersRes] = await Promise.all([
      this.eventRepo.findRoles(eventId),
      this.memberRepo.findManyByOrg(caller.orgId!),
    ]);

    const mappedRoles = await Promise.all(
      roles.map(async (r) => {
        const profile = await this.profileRepo.findByUserId(r.userId);
        return {
          id: r.id,
          eventId: r.eventId,
          userId: r.userId,
          name: profile?.fullName || "Member",
          email: profile?.email || "",
          role: r.role,
        };
      })
    );

    const availableMembers = membersRes.items.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
      department: m.department,
    }));

    return {
      roles: mappedRoles,
      availableMembers,
    };
  }

  async createEventRole(eventId: string, userId: string, role: string, caller: CallerContext): Promise<any> {
    await this.assertOrgOwnsEvent(eventId, caller);
    const created = await this.eventRepo.assignRole(eventId, userId, role);
    return {
      roleId: created.id,
      eventId: created.eventId,
      userId: created.userId,
      role: created.role,
    };
  }

  async deleteEventRole(eventId: string, roleId: string, caller: CallerContext): Promise<{ success: boolean }> {
    await this.assertOrgOwnsEvent(eventId, caller);
    await this.eventRepo.removeRole(eventId, roleId);
    return { success: true };
  }

  async listMembers(caller: CallerContext, filters?: any): Promise<any> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const res = await this.memberRepo.findManyByOrg(caller.orgId, filters);
    const items = res.items.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
      department: m.department,
      avatarUrl: m.avatarUrl,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      items,
      meta: {
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
        hasNextPage: res.hasNextPage,
        hasPreviousPage: res.hasPreviousPage,
      },
    };
  }

  async updateMemberRole(memberId: string, role: string, caller: CallerContext): Promise<any> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const member = await this.memberRepo.findById(memberId);
    if (!member || member.organisationId !== caller.orgId) {
      throw notFound("Member not found in organisation");
    }

    const updated = await this.memberRepo.updateRole(memberId, role);
    return {
      success: true,
      memberId: updated.id,
      role: updated.role,
    };
  }

  async scanAttendance(eventId: string, ticketCode: string, caller: CallerContext): Promise<any> {
    await this.assertOrgOwnsEvent(eventId, caller);

    const trimmed = ticketCode.trim();
    let reg = await this.registrationRepo.findByTicketCode(trimmed);
    let attendeeUserId = reg ? reg.userId : null;

    if (!reg || reg.eventId !== eventId) {
      const profile = await this.profileRepo.findByCklId(trimmed)
        || await this.profileRepo.findByCklId(trimmed.toUpperCase())
        || await this.profileRepo.findByUserId(trimmed);
      if (profile) {
        attendeeUserId = profile.userId;
        const directReg = await this.registrationRepo.findByUserAndEvent(profile.userId, eventId);
        if (directReg) {
          reg = directReg;
        } else {
          const userTickets = await this.registrationRepo.findUserTickets(profile.userId);
          const eventTicket = userTickets.find((t) => t.eventId === eventId);
          if (eventTicket) {
            reg = eventTicket;
          }
        }
      }
    }

    if (!reg || reg.eventId !== eventId) {
      throw notFound("Invalid ticket code for this event");
    }

    const profile = await this.profileRepo.findByUserId(attendeeUserId || reg.userId);

    return {
      registrationId: reg.id,
      ticketCode: reg.ticketCode,
      attended: reg.attended,
      registeredAt: reg.createdAt.toISOString(),
      participant: {
        id: profile?.userId || reg.userId,
        name: profile?.fullName || "Attendee",
        email: profile?.email || "",
        cklId: profile?.cklId,
        college: profile?.college,
      },
    };
  }

  async confirmAttendance(eventId: string, registrationId: string, caller: CallerContext): Promise<any> {
    await this.assertOrgOwnsEvent(eventId, caller);

    const reg = await this.registrationRepo.findById(registrationId);
    if (!reg || reg.eventId !== eventId) {
      throw notFound("Registration not found");
    }

    if (reg.attended) {
      throw badRequest("Attendee has already been checked in");
    }

    const now = new Date();
    await this.registrationRepo.update(registrationId, {
      attended: true,
      attendedAt: now,
    });

    return {
      success: true,
      registrationId,
      attended: true,
      attendedAt: now.toISOString(),
    };
  }
}
