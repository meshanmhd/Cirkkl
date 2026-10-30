import { EventRepo, TicketRepo, TransactionRunner } from "../ports/repositories";
import { Event, EventStatus, Ticket } from "../ports/domain";
import { CallerContext } from "./auth.service";
import { conflict, forbidden, notFound } from "../errors";

export class EventService {
  constructor(
    private readonly eventRepo: EventRepo,
    private readonly ticketRepo: TicketRepo,
    private readonly transactionRunner: TransactionRunner
  ) {}

  async listEvents(input: {
    search?: string;
    category?: string;
    timeFilter?: "upcoming" | "past" | "all";
    cursor?: string;
    limit?: number;
  }): Promise<{ items: any[]; nextCursor: string | null }> {
    const res = await this.eventRepo.findPublicEvents(input);
    const items = res.items.map((e) => this.mapToSummary(e));
    return {
      items,
      nextCursor: res.nextCursor,
    };
  }

  async getEvent(idOrSlug: string): Promise<any> {
    const event = await this.eventRepo.findPublicByIdOrSlug(idOrSlug);
    if (!event) {
      throw notFound("Event not found");
    }

    const [tickets, hosts] = await Promise.all([
      this.ticketRepo.findByEventId(event.id),
      this.eventRepo.findHosts(event.id),
    ]);

    return this.mapToDetail(event, tickets, hosts);
  }

  async getForOrg(id: string, caller: CallerContext): Promise<any> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const event = await this.eventRepo.findOrgEvent(id, caller.orgId);
    if (!event) {
      throw notFound("Event not found for organisation");
    }

    const [tickets, hosts] = await Promise.all([
      this.ticketRepo.findByEventId(event.id),
      this.eventRepo.findHosts(event.id),
    ]);

    return {
      ...this.mapToDetail(event, tickets, hosts),
      orgId: caller.orgId,
    };
  }

  async createEvent(input: any, caller: CallerContext): Promise<any> {
    if (!caller.orgId || !caller.isOrgApproved) {
      throw forbidden("Approved organisation required to create events");
    }

    const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);

    const created = await this.eventRepo.create({
      organisationId: caller.orgId,
      title: input.title,
      slug,
      description: input.description,
      venue: input.venue,
      city: input.city,
      startDate: new Date(input.date),
      endDate: input.endDate ? new Date(input.endDate) : null,
      registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : null,
      status: input.isDraft ? "draft" : "published",
      visibility: input.visibility || "public",
      isFeatured: false,
      isPaid: input.price === "paid",
      isTeamEvent: Boolean(input.isTeamEvent),
      minTeamSize: input.teamMinSize,
      maxTeamSize: input.teamMaxSize,
      bannerUrl: input.imageKey,
      posterUrl: input.posterImageKey,
      speakers: input.speakers,
      customFields: input.customFields,
    });

    let tickets: Ticket[] = [];
    if (input.tickets && Array.isArray(input.tickets) && input.tickets.length > 0) {
      tickets = await this.ticketRepo.createMany(
        input.tickets.map((t: any) => ({
          eventId: created.id,
          name: t.name,
          price: t.price,
          currency: "INR",
          totalQuantity: t.quantity ?? 100,
          availableQuantity: t.quantity ?? 100,
        }))
      );
    }

    return this.mapToDetail(created, tickets, []);
  }

  async updateEvent(id: string, input: any, caller: CallerContext): Promise<any> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const existing = await this.eventRepo.findById(id);
    if (!existing) {
      throw notFound("Event not found");
    }

    if (existing.organisationId !== caller.orgId) {
      throw forbidden("You do not own this event");
    }

    return this.transactionRunner.run(async (uow) => {
      const updateData: Partial<Event> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.venue !== undefined) updateData.venue = input.venue;
      if (input.city !== undefined) updateData.city = input.city;
      if (input.date !== undefined) updateData.startDate = new Date(input.date);
      if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
      if (input.registrationDeadline !== undefined) updateData.registrationDeadline = new Date(input.registrationDeadline);
      if (input.visibility !== undefined) updateData.visibility = input.visibility;
      if (input.price !== undefined) updateData.isPaid = input.price === "paid";
      if (input.isTeamEvent !== undefined) updateData.isTeamEvent = input.isTeamEvent;
      if (input.teamMinSize !== undefined) updateData.minTeamSize = input.teamMinSize;
      if (input.teamMaxSize !== undefined) updateData.maxTeamSize = input.teamMaxSize;
      if (input.imageKey !== undefined) updateData.bannerUrl = input.imageKey;
      if (input.posterImageKey !== undefined) updateData.posterUrl = input.posterImageKey;
      if (input.speakers !== undefined) updateData.speakers = input.speakers;
      if (input.customFields !== undefined) updateData.customFields = input.customFields;

      const updatedEvent = await uow.eventRepo.update(id, updateData);

      if (input.tickets && Array.isArray(input.tickets)) {
        const existingTickets = await uow.ticketRepo.findByEventId(id);
        const incomingIds = new Set(input.tickets.filter((t: any) => t.id).map((t: any) => t.id));

        for (const existingTicket of existingTickets) {
          if (!incomingIds.has(existingTicket.id)) {
            const hasRegistrations = await uow.ticketRepo.hasRegistrationsOrPayments(existingTicket.id);
            if (hasRegistrations) {
              throw conflict(`Cannot delete ticket tier '${existingTicket.name}' as it has existing registrations or payments`);
            }
            await uow.ticketRepo.delete(existingTicket.id);
          }
        }

        for (const incomingTicket of input.tickets) {
          if (incomingTicket.id) {
            await uow.ticketRepo.update(incomingTicket.id, {
              name: incomingTicket.name,
              price: incomingTicket.price,
              totalQuantity: incomingTicket.quantity ?? 100,
            });
          } else {
            await uow.ticketRepo.create({
              eventId: id,
              name: incomingTicket.name,
              price: incomingTicket.price,
              currency: "INR",
              totalQuantity: incomingTicket.quantity ?? 100,
              availableQuantity: incomingTicket.quantity ?? 100,
            });
          }
        }
      }

      const [tickets, hosts] = await Promise.all([
        uow.ticketRepo.findByEventId(id),
        uow.eventRepo.findHosts(id),
      ]);

      return this.mapToDetail(updatedEvent, tickets, hosts);
    });
  }

  async deleteEvent(id: string, caller: CallerContext): Promise<{ success: boolean }> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const event = await this.eventRepo.findById(id);
    if (!event) {
      throw notFound("Event not found");
    }

    if (event.organisationId !== caller.orgId) {
      throw forbidden("You do not own this event");
    }

    await this.eventRepo.delete(id);
    return { success: true };
  }

  async updateEventStatus(id: string, status: EventStatus, caller: CallerContext): Promise<{ success: boolean; status: EventStatus }> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const event = await this.eventRepo.findById(id);
    if (!event) {
      throw notFound("Event not found");
    }

    if (event.organisationId !== caller.orgId) {
      throw forbidden("You do not own this event");
    }

    const updated = await this.eventRepo.update(id, { status });
    return { success: true, status: updated.status };
  }

  async listOrgEvents(
    filters: { search?: string; status?: string; cursor?: string; limit?: number },
    caller: CallerContext
  ): Promise<{ items: any[]; nextCursor: string | null }> {
    if (!caller.orgId) {
      throw forbidden("Organisation access required");
    }

    const res = await this.eventRepo.findOrgEvents(caller.orgId, filters);
    const items = res.items.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      date: e.startDate ? e.startDate.toISOString().split("T")[0] : null,
      startDate: e.startDate ? e.startDate.toISOString().split("T")[0] : null,
      endDate: e.endDate ? e.endDate.toISOString().split("T")[0] : null,
      time: e.time ?? null,
      endTime: e.endTime ?? null,
      category: e.category || "General",
      status: e.status,
      visibility: e.visibility,
      price: e.price || (e.isPaid ? "paid" : "free"),
      createdAt: e.createdAt.toISOString(),
    }));

    return {
      items,
      nextCursor: res.nextCursor,
    };
  }

  private mapToSummary(event: Event): any {
    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      tagline: event.tagline,
      category: event.category || "",
      organizer: event.organizer || "",
      image: event.bannerUrl || "",
      posterImage: event.posterUrl || null,
      date: event.startDate ? event.startDate.toISOString().split("T")[0] : "",
      time: event.time,
      endDate: event.endDate ? event.endDate.toISOString().split("T")[0] : null,
      endTime: event.endTime,
      location: event.location || event.venue || event.city || "Online",
      locationType: event.locationType || "physical",
      price: event.price || (event.isPaid ? "paid" : "free"),
      priceAmount: event.priceAmount,
      status: event.status,
      featured: event.isFeatured,
    };
  }

  private mapToDetail(event: Event, tickets: Ticket[], hosts: any[]): any {
    return {
      ...this.mapToSummary(event),
      description: event.description,
      tags: event.tags || [],
      venue: event.venue,
      city: event.city,
      locationLink: event.locationLink,
      meetingLink: event.meetingLink,
      platform: event.platform,
      seats: event.seats,
      seatsAvailable: event.seatsAvailable,
      approvalRequired: Boolean(event.approvalRequired),
      registrationDeadline: event.registrationDeadline ? event.registrationDeadline.toISOString().split("T")[0] : null,
      registrationEndTime: event.registrationEndTime,
      cancellationPolicy: event.cancellationPolicy,
      refundPolicy: event.refundPolicy,
      photographyPolicy: event.photographyPolicy,
      visibility: event.visibility,
      isTeamEvent: event.isTeamEvent,
      teamMinSize: event.minTeamSize ?? 1,
      teamMaxSize: event.maxTeamSize ?? 1,
      customFields: event.customFields || [],
      speakers: event.speakers || [],
      hosts: hosts || [],
      ticketTypes: tickets.map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price,
        quantity: t.totalQuantity != null && !isNaN(t.totalQuantity) ? t.totalQuantity : null,
        unlimited: t.unlimited ?? (t.totalQuantity == null || isNaN(t.totalQuantity)),
      })),
      totalRegistrations: 0,
      isFull: false,
    };
  }
}
