import crypto from "node:crypto";
import {
  EventRepo,
  NotificationRepo,
  RegistrationRepo,
  TeamRepo,
  TicketRepo,
  TransactionRunner,
} from "../ports/repositories";
import { CallerContext } from "./auth.service";
import { badRequest, conflict, notFound, unauthorized } from "../errors";

export class RegistrationService {
  constructor(
    private readonly registrationRepo: RegistrationRepo,
    private readonly eventRepo: EventRepo,
    private readonly ticketRepo: TicketRepo,
    private readonly teamRepo: TeamRepo,
    private readonly notificationRepo: NotificationRepo,
    private readonly transactionRunner: TransactionRunner
  ) {}

  async registerForEvent(input: any, caller: CallerContext): Promise<{
    registrationId: string;
    status: string;
    ticketCode: string;
  }> {
    const userId = caller.userId;
    const eventId = input.eventId;

    return this.transactionRunner.run(async (uow) => {
      const event = await uow.eventRepo.findById(eventId);
      if (!event) {
        throw notFound("Event not found");
      }

      if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        throw badRequest("Registration for this event is closed");
      }

      if (event.status !== "published") {
        throw badRequest("Event is not open for registration");
      }

      const currentCount = await uow.registrationRepo.countByEvent(eventId, "approved");
      const seatsAvailable = 500;
      if (currentCount >= seatsAvailable) {
        throw badRequest("Event is full");
      }

      if (input.ticketTierId) {
        const ticket = await uow.ticketRepo.findById(input.ticketTierId);
        if (!ticket || ticket.eventId !== eventId) {
          throw badRequest("Invalid ticket tier");
        }
        if (ticket.availableQuantity <= 0) {
          throw badRequest("Selected ticket tier is sold out");
        }
        await uow.ticketRepo.decrementAvailable(ticket.id, 1);
      }

      const existing = await uow.registrationRepo.findByUserAndEvent(userId, eventId);
      if (existing && existing.status !== "cancelled" && existing.status !== "rejected") {
        throw conflict("Already registered for this event");
      }

      let teamId: string | null = null;
      if (input.isTeamEvent) {
        const teamName = input.teamName || "Team";
        const team = await uow.teamRepo.create({
          name: teamName,
          eventId,
          leaderId: userId,
        });
        teamId = team.id;

        if (input.teamMates && Array.isArray(input.teamMates)) {
          for (const mate of input.teamMates) {
            await uow.teamRepo.addMember({
              teamId: team.id,
              userId: mate.id,
              status: "pending",
            });

            await uow.notificationRepo.create({
              userId: mate.id,
              type: "team_invite",
              title: "Team Invitation",
              message: `You were invited to join team ${teamName} for ${event.title}`,
              isRead: false,
              eventId,
              teamId: team.id,
              senderId: userId,
            });
          }
        }
      }

      const autoApprove = !event.isPaid;
      const initialStatus = autoApprove ? "approved" : "pending";

      let registrationId: string;
      let ticketCode: string;

      if (existing && (existing.status === "cancelled" || existing.status === "rejected")) {
        ticketCode = existing.ticketCode;
        const updated = await uow.registrationRepo.update(existing.id, {
          status: initialStatus,
          isTeam: Boolean(input.isTeamEvent),
          teamId,
          fieldValues: input.fieldValues || {},
          ticketId: input.ticketTierId || null,
          transactionId: input.transactionId || null,
          paymentProofKey: input.paymentProofKey || null,
        });
        registrationId = updated.id;
      } else {
        ticketCode = `CRK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        const created = await uow.registrationRepo.create({
          eventId,
          userId,
          ticketId: input.ticketTierId || null,
          ticketCode,
          status: initialStatus,
          attended: false,
          isTeam: Boolean(input.isTeamEvent),
          teamId,
          fieldValues: input.fieldValues || {},
          transactionId: input.transactionId || null,
          paymentProofKey: input.paymentProofKey || null,
        });
        registrationId = created.id;
      }

      if (autoApprove) {
        await uow.notificationRepo.create({
          userId,
          type: "registration_approved",
          title: "Registration Approved",
          message: `Your registration for ${event.title} is confirmed. Ticket code: ${ticketCode}`,
          isRead: false,
          eventId,
          teamId,
        });
      }

      return {
        registrationId,
        status: initialStatus,
        ticketCode,
      };
    });
  }

  async acceptTeamInvite(
    teamId: string,
    eventId: string,
    caller: CallerContext
  ): Promise<{ success: boolean }> {
    const userId = caller.userId;

    return this.transactionRunner.run(async (uow) => {
      const existing = await uow.registrationRepo.findByUserAndEvent(userId, eventId);
      if (existing && existing.status !== "cancelled" && existing.status !== "rejected") {
        throw conflict("Already registered for this event");
      }

      const team = await uow.teamRepo.findById(teamId);
      if (!team || team.eventId !== eventId) {
        throw notFound("Team not found");
      }

      const leaderReg = await uow.registrationRepo.findByUserAndEvent(team.leaderId, eventId);
      if (!leaderReg || (leaderReg.status !== "approved" && leaderReg.status !== "pending")) {
        throw badRequest("Team leader does not have an active registration");
      }

      await uow.teamRepo.updateMemberStatus(teamId, userId, "approved");

      await uow.notificationRepo.create({
        userId: team.leaderId,
        type: "general",
        title: "Team Invite Accepted",
        message: `A teammate has accepted your invite to ${team.name}`,
        isRead: false,
        eventId,
        teamId,
        senderId: userId,
      });

      return { success: true };
    });
  }

  async declineTeamInvite(
    teamId: string,
    eventId: string,
    caller: CallerContext
  ): Promise<{ success: boolean }> {
    await this.teamRepo.updateMemberStatus(teamId, caller.userId, "rejected");
    return { success: true };
  }

  async myTickets(caller: CallerContext): Promise<{ tickets: any[] }> {
    const tickets = await this.registrationRepo.findUserTickets(caller.userId);
    return {
      tickets: tickets.map((t) => ({
        ticketCode: t.ticketCode,
        eventId: t.eventId,
        eventTitle: t.eventTitle,
        status: t.status,
      })),
    };
  }

  async getMine(eventId: string, caller: CallerContext): Promise<{ registration: any | null }> {
    const reg = await this.registrationRepo.findMine(caller.userId, eventId);
    if (!reg) {
      return { registration: null };
    }
    return {
      registration: {
        id: reg.id,
        status: reg.status,
        attended: reg.attended,
        ticketCode: reg.ticketCode,
        teamId: reg.teamId,
        ticketTierId: reg.ticketId,
      },
    };
  }

  async lookupTeammate(
    eventId: string,
    cklId: string,
    caller: CallerContext
  ): Promise<{ id: string; displayName: string }> {
    const result = await this.registrationRepo.lookupTeammate(eventId, cklId);
    if (!result) {
      throw notFound("No user found with this CKL ID");
    }

    if (result.id === caller.userId) {
      throw badRequest("You cannot add yourself as a teammate");
    }

    if (result.isRegistered) {
      throw conflict("User is already registered for this event");
    }

    if (result.isInTeam) {
      throw conflict("User is already part of a team for this event");
    }

    return {
      id: result.id,
      displayName: result.displayName,
    };
  }
}
