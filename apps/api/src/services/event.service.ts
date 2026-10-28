import { EventRepo, TicketRepo, TransactionRunner } from "../ports/repositories";
import { Event, EventStatus, Ticket } from "../ports/domain";
import { CallerContext } from "./auth.service";
import { badRequest, conflict, forbidden, notFound } from "../errors";

function parseDateStr(d: any): string | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  const s = String(d).trim();
  return s.includes("T") ? s.split("T")[0] : s.slice(0, 10);
}

function parseTimeStr(t: any): string | null {
  if (!t) return null;
  return String(t).trim().slice(0, 5);
}

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

    const normDate = parseDateStr(input.date);
    const normEndDate = parseDateStr(input.endDate);
    const normRegDeadline = parseDateStr(input.registrationDeadline);

    if (normDate && normEndDate) {
      if (normEndDate < normDate) {
        throw badRequest("End date must be on or after the start date");
      }
      if (normEndDate === normDate && input.time && input.endTime) {
        if (input.endTime <= input.time) {
          throw badRequest("End time must be after the start time");
        }
      }
    }

    if (normDate && normRegDeadline) {
      const effectiveEndDate = normEndDate || normDate;
      const effectiveEndTime = normEndDate ? (input.endTime || "23:59") : (input.endTime || input.time || "23:59");
      const eventStartStr = `${normDate}T${input.time ? (input.time.length === 5 ? `${input.time}:00` : input.time) : "00:00:00"}`;
      const eventEndStr = `${effectiveEndDate}T${effectiveEndTime.length === 5 ? `${effectiveEndTime}:00` : effectiveEndTime}`;
      const regEndStr = `${normRegDeadline}T${input.registrationEndTime ? (input.registrationEndTime.length === 5 ? `${input.registrationEndTime}:00` : input.registrationEndTime) : "23:59:59"}`;

      if (new Date(regEndStr).getTime() < new Date(eventStartStr).getTime() || new Date(regEndStr).getTime() > new Date(eventEndStr).getTime()) {
        throw badRequest("Registration deadline must be between the event start date and end date");
      }
    }

    const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);

    const created = await this.eventRepo.create({
      organisationId: caller.orgId,
      title: input.title,
      slug,
      tagline: input.tagline ?? null,
      category: input.category ?? null,
      description: input.description,
      venue: input.venue ?? null,
      city: input.city ?? null,
      startDate: new Date(input.time ? `${normDate}T${input.time.length === 5 ? `${input.time}:00` : input.time}` : `${normDate}T00:00:00`),
      endDate: normEndDate ? new Date(input.endTime ? `${normEndDate}T${input.endTime.length === 5 ? `${input.endTime}:00` : input.endTime}` : `${normEndDate}T23:59:59`) : null,
      time: input.time ?? null,
      endTime: input.endTime ?? null,
      locationType: input.locationType ?? "physical",
      locationLink: input.locationLink ?? null,
      meetingLink: input.meetingLink ?? null,
      platform: input.platform ?? null,
      registrationDeadline: normRegDeadline ? new Date(input.registrationEndTime ? `${normRegDeadline}T${input.registrationEndTime.length === 5 ? `${input.registrationEndTime}:00` : input.registrationEndTime}` : `${normRegDeadline}T23:59:59`) : null,
      registrationEndTime: input.registrationEndTime ?? null,
      status: input.isDraft ? "draft" : "published",
      visibility: input.visibility || "public",
      isFeatured: false,
      isPaid: input.price === "paid",
      price: input.price ?? (input.price === "paid" ? "paid" : "free"),
      seats: input.capacity !== undefined && input.capacity !== null && input.capacity !== "" ? Number(input.capacity) : null,
      seatsAvailable: input.capacity !== undefined && input.capacity !== null && input.capacity !== "" ? Number(input.capacity) : null,
      approvalRequired: input.price === "paid" ? true : Boolean(input.approvalRequired),
      cancellationPolicy: input.cancellationPolicy ?? null,
      refundPolicy: input.refundPolicy ?? null,
      photographyPolicy: input.photographyPolicy ?? null,
      tags: input.tags ?? [],
      isTeamEvent: Boolean(input.isTeamEvent),
      minTeamSize: input.teamMinSize ?? 1,
      maxTeamSize: input.teamMaxSize ?? 1,
      bannerUrl: input.imageKey ?? null,
      posterUrl: input.posterImageKey ?? null,
      speakers: input.speakers ?? [],
      customFields: input.customFields ?? [],
      hosts: input.hosts ?? [],
    });

    if (input.hosts && Array.isArray(input.hosts) && input.hosts.length > 0) {
      await this.eventRepo.setHosts(created.id, input.hosts);
    }

    let tickets: Ticket[] = [];
    if (input.tickets && Array.isArray(input.tickets) && input.tickets.length > 0) {
      tickets = await this.ticketRepo.createMany(
        input.tickets.map((t: any) => {
          const qty = t.quantity != null && !isNaN(t.quantity) ? t.quantity : null;
          return {
            eventId: created.id,
            name: t.name,
            price: t.price,
            currency: "INR",
            totalQuantity: qty,
            availableQuantity: qty,
            unlimited: t.unlimited ?? qty == null,
          };
        })
      );
    }

    const hosts = await this.eventRepo.findHosts(created.id);
    return this.mapToDetail(created, tickets, hosts);
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

    const effStartDate = input.date !== undefined ? (parseDateStr(input.date) || "") : (parseDateStr(existing.startDate) || "");
    const effEndDate = input.endDate !== undefined ? (parseDateStr(input.endDate) || "") : (parseDateStr(existing.endDate) || "");
    const effStartTime = input.time !== undefined ? input.time : (existing.time || "");
    const effEndTime = input.endTime !== undefined ? (input.endTime || "") : (existing.endTime || "");
    const effRegDate = input.registrationDeadline !== undefined ? (parseDateStr(input.registrationDeadline) || "") : (parseDateStr(existing.registrationDeadline) || "");
    const effRegEndTime = input.registrationEndTime !== undefined ? (input.registrationEndTime || "") : (existing.registrationEndTime || "");

    if (effStartDate && effEndDate) {
      if (effEndDate < effStartDate) {
        throw badRequest("End date must be on or after the start date");
      }
      if (effEndDate === effStartDate && effStartTime && effEndTime) {
        if (effEndTime <= effStartTime) {
          throw badRequest("End time must be after the start time");
        }
      }
    }

    if (effStartDate && effRegDate) {
      const targetEndDate = effEndDate || effStartDate;
      const targetEndTime = effEndDate ? (effEndTime || "23:59") : (effEndTime || effStartTime || "23:59");
      const eventStartStr = `${effStartDate}T${effStartTime ? (effStartTime.length === 5 ? `${effStartTime}:00` : effStartTime) : "00:00:00"}`;
      const eventEndStr = `${targetEndDate}T${targetEndTime.length === 5 ? `${targetEndTime}:00` : targetEndTime}`;
      const regEndStr = `${effRegDate}T${effRegEndTime ? (effRegEndTime.length === 5 ? `${effRegEndTime}:00` : effRegEndTime) : "23:59:59"}`;

      if (new Date(regEndStr).getTime() < new Date(eventStartStr).getTime() || new Date(regEndStr).getTime() > new Date(eventEndStr).getTime()) {
        throw badRequest("Registration deadline must be between the event start date and end date");
      }
    }

    return this.transactionRunner.run(async (uow) => {
      const updateData: Partial<Event> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.tagline !== undefined) updateData.tagline = input.tagline;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.venue !== undefined) updateData.venue = input.venue;
      if (input.city !== undefined) updateData.city = input.city;
      if (input.date !== undefined) {
        const dStr = parseDateStr(input.date);
        const timePart = input.time !== undefined ? input.time : (existing.time || "");
        updateData.startDate = dStr ? new Date(timePart ? `${dStr}T${timePart.length === 5 ? `${timePart}:00` : timePart}` : `${dStr}T00:00:00`) : existing.startDate;
      }
      if (input.time !== undefined) updateData.time = input.time;
      if (input.endDate !== undefined) {
        const dStr = parseDateStr(input.endDate);
        const endTPart = input.endTime !== undefined ? input.endTime : (existing.endTime || "");
        updateData.endDate = dStr ? new Date(endTPart ? `${dStr}T${endTPart.length === 5 ? `${endTPart}:00` : endTPart}` : `${dStr}T23:59:59`) : null;
      }
      if (input.endTime !== undefined) updateData.endTime = input.endTime;
      if (input.locationType !== undefined) updateData.locationType = input.locationType;
      if (input.locationLink !== undefined) updateData.locationLink = input.locationLink;
      if (input.meetingLink !== undefined) updateData.meetingLink = input.meetingLink;
      if (input.platform !== undefined) updateData.platform = input.platform;
      if (input.registrationDeadline !== undefined) {
        const dStr = parseDateStr(input.registrationDeadline);
        const regEndTPart = input.registrationEndTime !== undefined ? input.registrationEndTime : (existing.registrationEndTime || "");
        updateData.registrationDeadline = dStr ? new Date(regEndTPart ? `${dStr}T${regEndTPart.length === 5 ? `${regEndTPart}:00` : regEndTPart}` : `${dStr}T23:59:59`) : null;
      }
      if (input.registrationEndTime !== undefined) updateData.registrationEndTime = input.registrationEndTime;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.visibility !== undefined) updateData.visibility = input.visibility;
      if (input.price !== undefined) {
        updateData.price = input.price;
        updateData.isPaid = input.price === "paid";
      }
      if (input.capacity !== undefined) {
        const cap = input.capacity !== null && input.capacity !== "" ? Number(input.capacity) : null;
        updateData.seats = cap;
        updateData.seatsAvailable = cap;
      }
      if (input.approvalRequired !== undefined) updateData.approvalRequired = Boolean(input.approvalRequired);
      if (input.cancellationPolicy !== undefined) updateData.cancellationPolicy = input.cancellationPolicy;
      if (input.refundPolicy !== undefined) updateData.refundPolicy = input.refundPolicy;
      if (input.photographyPolicy !== undefined) updateData.photographyPolicy = input.photographyPolicy;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.isTeamEvent !== undefined) updateData.isTeamEvent = Boolean(input.isTeamEvent);
      if (input.teamMinSize !== undefined) updateData.minTeamSize = input.teamMinSize;
      if (input.teamMaxSize !== undefined) updateData.maxTeamSize = input.teamMaxSize;
      if (input.imageKey !== undefined) updateData.bannerUrl = input.imageKey;
      if (input.posterImageKey !== undefined) updateData.posterUrl = input.posterImageKey;
      if (input.speakers !== undefined) updateData.speakers = input.speakers;
      if (input.customFields !== undefined) updateData.customFields = input.customFields;
      if (input.hosts !== undefined) updateData.hosts = input.hosts;

      const updatedEvent = await uow.eventRepo.update(id, updateData);

      if (input.hosts && Array.isArray(input.hosts)) {
        await uow.eventRepo.setHosts(id, input.hosts);
      }

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
          const qty = incomingTicket.quantity != null && !isNaN(incomingTicket.quantity) ? incomingTicket.quantity : null;
          const isUnlimited = incomingTicket.unlimited ?? qty == null;
          if (incomingTicket.id) {
            await uow.ticketRepo.update(incomingTicket.id, {
              name: incomingTicket.name,
              price: incomingTicket.price,
              totalQuantity: qty,
              availableQuantity: qty,
              unlimited: isUnlimited,
            });
          } else {
            await uow.ticketRepo.create({
              eventId: id,
              name: incomingTicket.name,
              price: incomingTicket.price,
              currency: "INR",
              totalQuantity: qty,
              availableQuantity: qty,
              unlimited: isUnlimited,
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
      date: parseDateStr(event.startDate || (event as any).date) || "",
      time: parseTimeStr(event.time),
      endDate: parseDateStr(event.endDate),
      endTime: parseTimeStr(event.endTime),
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
      registrationDeadline: parseDateStr(event.registrationDeadline),
      registrationEndTime: parseTimeStr(event.registrationEndTime),
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
