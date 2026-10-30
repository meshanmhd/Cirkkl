import {
  College,
  Event,
  EventHost,
  EventStatus,
  Member,
  MerchantSettings,
  Notification,
  NotificationType,
  Organisation,
  PaginatedResult,
  PaginationOptions,
  Payment,
  PaymentStatus,
  Profile,
  Registration,
  RegistrationStatus,
  Team,
  TeamMember,
  TeamMemberStatus,
  Ticket,
} from "../../ports/domain";
import {
  EventRepo,
  MemberRepo,
  NotificationRepo,
  OrganisationRepo,
  PaymentRepo,
  ProfileRepo,
  AdminRepo,
  RegistrationRepo,
  TeamRepo,
  TicketRepo,
  TransactionRunner,
  UnitOfWork,
  VerifyOtpResult,
} from "../../ports/repositories";
import { timingSafeEqual } from "crypto";
import { decryptOtp, verifyLegacyHmac } from "../../crypto";

export class MemoryEventRepo implements EventRepo {
  events: Map<string, Event> = new Map();
  hosts: Map<string, EventHost[]> = new Map();
  roles: Map<string, Array<{ id: string; eventId: string; userId: string; role: string }>> = new Map();

  async findById(id: string): Promise<Event | null> {
    return this.events.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    for (const ev of this.events.values()) {
      if (ev.slug === slug) return ev;
    }
    return null;
  }

  async findPublicByIdOrSlug(idOrSlug: string): Promise<Event | null> {
    for (const ev of this.events.values()) {
      if ((ev.id === idOrSlug || ev.slug === idOrSlug) && ev.status === "published") {
        return ev;
      }
    }
    return null;
  }

  async findOrgEvent(id: string, orgId: string): Promise<Event | null> {
    const ev = this.events.get(id);
    if (ev && ev.organisationId === orgId) return ev;
    return null;
  }

  async findPublicEvents(filters: {
    search?: string;
    category?: string;
    timeFilter?: "upcoming" | "past" | "all";
    cursor?: string;
    limit?: number;
    allowedOrgIds?: string[];
  }): Promise<{ items: Event[]; nextCursor: string | null }> {
    let list = Array.from(this.events.values()).filter((e) => e.status === "published");
    if (filters.allowedOrgIds && filters.allowedOrgIds.length > 0) {
      list = list.filter((e) => e.visibility !== "private" || filters.allowedOrgIds!.includes(e.organisationId));
    } else {
      list = list.filter((e) => e.visibility !== "private");
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    if (filters.timeFilter === "upcoming") {
      list = list.filter((e) => {
        if (e.endDate) {
          return e.endDate >= now || e.startDate >= now;
        }
        return e.startDate >= todayStart;
      });
    } else if (filters.timeFilter === "past") {
      list = list.filter((e) => {
        if (e.endDate) {
          return e.endDate < now;
        }
        return e.startDate < todayStart;
      });
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filters.cursor) {
      const idx = list.findIndex((e) => e.id === filters.cursor);
      if (idx !== -1) {
        list = list.slice(idx + 1);
      }
    }

    const limit = filters.limit ?? 20;
    const items = list.slice(0, limit);
    const nextCursor = list.length > limit ? items[items.length - 1].id : null;

    return { items, nextCursor };
  }

  async findMany(
    filters?: {
      status?: EventStatus;
      isFeatured?: boolean;
      search?: string;
      startDateGte?: Date;
      orgId?: string;
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Event>> {
    let list = Array.from(this.events.values());
    if (filters?.status) list = list.filter((e) => e.status === filters.status);
    if (filters?.isFeatured !== undefined) list = list.filter((e) => e.isFeatured === filters.isFeatured);
    if (filters?.orgId) list = list.filter((e) => e.organisationId === filters.orgId);
    if (filters?.startDateGte) list = list.filter((e) => e.startDate >= filters.startDateGte!);

    const total = list.length;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;
    const items = list.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOrgEvents(
    orgId: string,
    filters?: { search?: string; status?: string; cursor?: string; limit?: number }
  ): Promise<{ items: Event[]; nextCursor: string | null }> {
    let list = Array.from(this.events.values()).filter((e) => e.organisationId === orgId);
    if (filters?.status) list = list.filter((e) => e.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }
    const limit = filters?.limit ?? 20;
    const items = list.slice(0, limit);
    const nextCursor = list.length > limit ? items[items.length - 1].id : null;
    return { items, nextCursor };
  }

  async create(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> {
    const id = crypto.randomUUID();
    const event: Event = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    const existing = this.events.get(id);
    if (!existing) throw new Error("Event not found");
    const updated: Event = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.events.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id);
  }

  async findHosts(eventId: string): Promise<EventHost[]> {
    return this.hosts.get(eventId) ?? [];
  }

  async setHosts(eventId: string, hostUserIds: string[]): Promise<void> {
    this.hosts.set(
      eventId,
      hostUserIds.map((id) => ({ id, name: "Host" }))
    );
  }

  async findRoles(eventId: string): Promise<Array<{ id: string; eventId: string; userId: string; role: string }>> {
    return this.roles.get(eventId) ?? [];
  }

  async assignRole(
    eventId: string,
    userId: string,
    role: string
  ): Promise<{ id: string; eventId: string; userId: string; role: string }> {
    const list = this.roles.get(eventId) ?? [];
    const item = { id: crypto.randomUUID(), eventId, userId, role };
    list.push(item);
    this.roles.set(eventId, list);
    return item;
  }

  async removeRole(eventId: string, roleId: string): Promise<void> {
    const list = this.roles.get(eventId) ?? [];
    this.roles.set(
      eventId,
      list.filter((r) => r.id !== roleId)
    );
  }
}

export class MemoryTicketRepo implements TicketRepo {
  tickets: Map<string, Ticket> = new Map();
  registrationRepo?: MemoryRegistrationRepo;

  constructor(registrationRepo?: MemoryRegistrationRepo) {
    this.registrationRepo = registrationRepo;
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) ?? null;
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter((t) => t.eventId === eventId);
  }

  async create(data: Omit<Ticket, "id" | "createdAt">): Promise<Ticket> {
    const id = crypto.randomUUID();
    const ticket: Ticket = {
      ...data,
      id,
      currency: "INR",
      createdAt: new Date(),
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async createMany(data: Array<Omit<Ticket, "id" | "createdAt">>): Promise<Ticket[]> {
    const result: Ticket[] = [];
    for (const item of data) {
      result.push(await this.create(item));
    }
    return result;
  }

  async update(id: string, data: Partial<Ticket>): Promise<Ticket> {
    const existing = this.tickets.get(id);
    if (!existing) throw new Error("Ticket not found");
    const updated = { ...existing, ...data };
    this.tickets.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.tickets.delete(id);
  }

  async decrementAvailable(id: string, quantity: number): Promise<void> {
    const ticket = this.tickets.get(id);
    if (ticket && ticket.availableQuantity !== null && ticket.availableQuantity >= quantity) {
      ticket.availableQuantity -= quantity;
    }
  }

  async hasRegistrationsOrPayments(ticketId: string): Promise<boolean> {
    if (!this.registrationRepo) return false;
    return Array.from(this.registrationRepo.registrations.values()).some(
      (r) => r.ticketId === ticketId && r.status !== "cancelled" && r.status !== "rejected"
    );
  }
}

export class MemoryRegistrationRepo implements RegistrationRepo {
  registrations: Map<string, Registration> = new Map();
  userDirectory: Map<string, { id: string; fullName: string; cklId: string }> = new Map();

  async findById(id: string): Promise<Registration | null> {
    return this.registrations.get(id) ?? null;
  }

  async findByTicketCode(ticketCode: string): Promise<Registration | null> {
    const trimmed = ticketCode.trim().toLowerCase();
    for (const r of this.registrations.values()) {
      if (r.ticketCode.trim().toLowerCase() === trimmed) return r;
    }
    return null;
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<Registration | null> {
    for (const r of this.registrations.values()) {
      if (r.userId === userId && r.eventId === eventId) return r;
    }
    return null;
  }

  async findMine(userId: string, eventId: string): Promise<Registration | null> {
    return this.findByUserAndEvent(userId, eventId);
  }

  async lookupTeammate(
    eventId: string,
    cklId: string
  ): Promise<{ id: string; displayName: string; isRegistered: boolean; isInTeam: boolean } | null> {
    for (const u of this.userDirectory.values()) {
      if (u.cklId === cklId) {
        const reg = await this.findByUserAndEvent(u.id, eventId);
        const isRegistered = Boolean(reg && reg.status !== "rejected" && reg.status !== "cancelled");
        return {
          id: u.id,
          displayName: u.fullName,
          isRegistered,
          isInTeam: false,
        };
      }
    }
    return null;
  }

  async findByEvent(
    eventId: string,
    filters?: { status?: RegistrationStatus; search?: string },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Registration>> {
    let list = Array.from(this.registrations.values()).filter((r) => r.eventId === eventId);
    if (filters?.status) list = list.filter((r) => r.status === filters.status);

    const total = list.length;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;
    const items = list.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findUserTickets(userId: string): Promise<Array<Registration & {
    eventTitle: string;
    eventDate?: Date;
    endDate?: Date | null;
    endTime?: string | null;
    dateStr?: string | null;
    timeStr?: string | null;
  }>> {
    return Array.from(this.registrations.values())
      .filter((r) => r.userId === userId && r.status === "approved")
      .map((r) => ({ ...r, eventTitle: "Event" }));
  }

  async countByEvent(eventId: string, status?: RegistrationStatus): Promise<number> {
    return Array.from(this.registrations.values()).filter(
      (r) => r.eventId === eventId && (!status || r.status === status)
    ).length;
  }

  async create(data: Omit<Registration, "id" | "createdAt" | "updatedAt">): Promise<Registration> {
    const id = crypto.randomUUID();
    const reg: Registration = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.registrations.set(id, reg);
    return reg;
  }

  async update(id: string, data: Partial<Registration>): Promise<Registration> {
    const existing = this.registrations.get(id);
    if (!existing) throw new Error("Registration not found");
    const updated: Registration = { ...existing, ...data, updatedAt: new Date() };
    this.registrations.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.registrations.delete(id);
  }
}

export class MemoryTeamRepo implements TeamRepo {
  teams: Map<string, Team> = new Map();
  members: Map<string, TeamMember[]> = new Map();

  async findById(id: string): Promise<Team | null> {
    return this.teams.get(id) ?? null;
  }

  async findByLeaderAndEvent(leaderId: string, eventId: string): Promise<Team | null> {
    for (const t of this.teams.values()) {
      if (t.leaderId === leaderId && t.eventId === eventId) return t;
    }
    return null;
  }

  async findActiveMembership(userId: string, eventId: string): Promise<TeamMember | null> {
    for (const [teamId, memberList] of this.members.entries()) {
      const team = this.teams.get(teamId);
      if (team && team.eventId === eventId) {
        const mem = memberList.find((m) => m.userId === userId && m.status !== "rejected");
        if (mem) return mem;
      }
    }
    return null;
  }

  async findByEvent(eventId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter((t) => t.eventId === eventId);
  }

  async create(data: { name: string; eventId: string; leaderId: string }): Promise<Team> {
    const id = crypto.randomUUID();
    const team: Team = { ...data, id, createdAt: new Date() };
    this.teams.set(id, team);
    this.members.set(id, []);
    return team;
  }

  async delete(id: string): Promise<void> {
    this.teams.delete(id);
    this.members.delete(id);
  }

  async findMembers(teamId: string): Promise<TeamMember[]> {
    return this.members.get(teamId) ?? [];
  }

  async addMember(data: { teamId: string; userId: string; status: TeamMemberStatus }): Promise<TeamMember> {
    const list = this.members.get(data.teamId) ?? [];
    const member: TeamMember = {
      id: crypto.randomUUID(),
      teamId: data.teamId,
      userId: data.userId,
      status: data.status,
      createdAt: new Date(),
    };
    list.push(member);
    this.members.set(data.teamId, list);
    return member;
  }

  async updateMemberStatus(teamId: string, userId: string, status: TeamMemberStatus): Promise<TeamMember> {
    const list = this.members.get(teamId) ?? [];
    const member = list.find((m) => m.userId === userId);
    if (!member) throw new Error("Team member not found");
    member.status = status;
    return member;
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    const list = this.members.get(teamId) ?? [];
    this.members.set(
      teamId,
      list.filter((m) => m.userId !== userId)
    );
  }
}

export class MemoryOrganisationRepo implements OrganisationRepo {
  organisations: Map<string, Organisation> = new Map();

  async findById(id: string): Promise<Organisation | null> {
    return this.organisations.get(id) ?? null;
  }

  async findByOwnerId(ownerId: string): Promise<Organisation | null> {
    for (const org of this.organisations.values()) {
      if (org.ownerId === ownerId) return org;
    }
    return null;
  }

  async create(data: Omit<Organisation, "id" | "createdAt" | "updatedAt">): Promise<Organisation> {
    const id = data.ownerId;
    const org: Organisation = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.organisations.set(id, org);
    return org;
  }

  async update(id: string, data: Partial<Organisation>): Promise<Organisation> {
    const existing = this.organisations.get(id);
    if (!existing) throw new Error("Organisation not found");
    const updated = { ...existing, ...data };
    this.organisations.set(id, updated);
    return updated;
  }

  async verifyOtp(orgId: string, otp: string): Promise<VerifyOtpResult> {
    const org = this.organisations.get(orgId);
    if (!org || !org.otp) {
      return { success: false, reason: "not_found" };
    }
    if ((org.otpFailedAttempts ?? 0) >= 10) {
      return { success: false, reason: "max_attempts" };
    }
    if (org.otpExpiresAt && org.otpExpiresAt.getTime() < Date.now()) {
      return { success: false, reason: "expired" };
    }
    let isMatch = false;
    if (org.otp.startsWith("v1:")) {
      try {
        const decrypted = decryptOtp(org.otp);
        const decBuf = Buffer.from(decrypted, "utf8");
        const inBuf = Buffer.from(otp, "utf8");
        if (decBuf.length === inBuf.length) {
          isMatch = timingSafeEqual(decBuf, inBuf);
        }
      } catch {
        isMatch = false;
      }
    } else {
      isMatch = verifyLegacyHmac(otp, org.otp);
    }
    if (isMatch) {
      org.isOtpVerified = true;
      org.otp = null;
      org.otpExpiresAt = null;
      org.otpFailedAttempts = 0;
      return { success: true };
    }
    const nextAttempts = (org.otpFailedAttempts ?? 0) + 1;
    org.otpFailedAttempts = nextAttempts;
    if (nextAttempts >= 10) {
      return { success: false, reason: "max_attempts" };
    }
    return { success: false, reason: "invalid" };
  }
}

export class MemoryMemberRepo implements MemberRepo {
  members: Map<string, Member> = new Map();

  async findById(id: string): Promise<Member | null> {
    return this.members.get(id) ?? null;
  }

  async findByOrgAndUser(orgId: string, userId: string): Promise<Member | null> {
    for (const m of this.members.values()) {
      if (m.organisationId === orgId && m.userId === userId) return m;
    }
    return null;
  }

  async findOrgIdsForUser(userId: string): Promise<string[]> {
    const orgIds: string[] = [];
    for (const m of this.members.values()) {
      if (m.userId === userId) {
        orgIds.push(m.organisationId);
      }
    }
    return orgIds;
  }

  async findManyByOrg(
    orgId: string,
    filters?: { search?: string; department?: string; role?: string },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Member>> {
    const list = Array.from(this.members.values()).filter((m) => m.organisationId === orgId);
    const total = list.length;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;
    const items = list.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async create(data: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<Member> {
    const id = crypto.randomUUID();
    const mem: Member = { ...data, id, createdAt: new Date() };
    this.members.set(id, mem);
    return mem;
  }

  async updateRole(memberId: string, role: string): Promise<Member> {
    const mem = this.members.get(memberId);
    if (!mem) throw new Error("Member not found");
    mem.role = role;
    return mem;
  }

  async delete(id: string): Promise<void> {
    this.members.delete(id);
  }
}

export class MemoryNotificationRepo implements NotificationRepo {
  notifications: Map<string, Notification> = new Map();

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.get(id) ?? null;
  }

  async findByUser(
    userId: string,
    filters?: { type?: NotificationType; filter?: "all" | "invites" | "general" },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    let list = Array.from(this.notifications.values()).filter((n) => n.userId === userId);
    if (filters?.type) list = list.filter((n) => n.type === filters.type);
    else if (filters?.filter === "invites") list = list.filter((n) => n.type === "team_invite");
    else if (filters?.filter === "general") list = list.filter((n) => n.type !== "team_invite");

    const total = list.length;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;
    const items = list.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async create(data: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    const id = crypto.randomUUID();
    const n: Notification = { ...data, id, createdAt: new Date() };
    this.notifications.set(id, n);
    return n;
  }

  async createMany(data: Array<Omit<Notification, "id" | "createdAt">>): Promise<Notification[]> {
    const res: Notification[] = [];
    for (const d of data) res.push(await this.create(d));
    return res;
  }

  async markRead(id: string, userId: string): Promise<void> {
    const n = this.notifications.get(id);
    if (n && n.userId === userId) n.isRead = true;
  }

  async markAllRead(userId: string): Promise<number> {
    let count = 0;
    for (const n of this.notifications.values()) {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    return count;
  }

  async delete(id: string, userId: string): Promise<void> {
    const n = this.notifications.get(id);
    if (n && n.userId === userId) this.notifications.delete(id);
  }

  async deleteOldNotifications(userId: string, olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86400000);
    let count = 0;
    for (const [id, n] of this.notifications.entries()) {
      if ((!userId || n.userId === userId) && n.createdAt < cutoff) {
        this.notifications.delete(id);
        count++;
      }
    }
    return count;
  }

  async deleteByEventAndTeam(eventId: string, teamId: string, type: NotificationType): Promise<number> {
    let count = 0;
    for (const [id, n] of this.notifications.entries()) {
      if (n.eventId === eventId && n.teamId === teamId && n.type === type) {
        this.notifications.delete(id);
        count++;
      }
    }
    return count;
  }

  async countUnread(userId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter((n) => n.userId === userId && !n.isRead).length;
  }
}

export class MemoryProfileRepo implements ProfileRepo {
  profiles: Map<string, Profile> = new Map();

  async findByUserId(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async findByCklId(cklId: string): Promise<Profile | null> {
    const trimmed = cklId.trim().toLowerCase();
    for (const p of this.profiles.values()) {
      if (p.cklId && p.cklId.trim().toLowerCase() === trimmed) return p;
    }
    return null;
  }

  async create(data: Omit<Profile, "createdAt" | "updatedAt">): Promise<Profile> {
    const profile: Profile = { ...data, createdAt: new Date() };
    this.profiles.set(data.userId, profile);
    return profile;
  }

  async update(userId: string, data: Partial<Profile>): Promise<Profile> {
    const existing = this.profiles.get(userId);
    if (!existing) throw new Error("Profile not found");
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.profiles.set(userId, updated);
    return updated;
  }

  async updateAvatar(userId: string, avatarKey: string): Promise<string> {
    const p = this.profiles.get(userId);
    if (p) p.avatarUrl = avatarKey;
    return avatarKey;
  }

  async searchColleges(query: string, limit?: number): Promise<College[]> {
    return [{ name: "Example University", city: "City", state: "State" }];
  }
}

export class MemoryPaymentRepo implements PaymentRepo {
  payments: Map<string, Payment> = new Map();

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) ?? null;
  }

  async findByOrderReference(orderReference: string): Promise<Payment | null> {
    for (const p of this.payments.values()) {
      if (p.orderReference === orderReference) return p;
    }
    return null;
  }

  async getMerchantSettings(): Promise<MerchantSettings> {
    return { upiId: "merchant@upi", merchantName: "Cirkkl" };
  }

  async create(data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment> {
    const id = crypto.randomUUID();
    const payment: Payment = { ...data, id, createdAt: new Date() };
    this.payments.set(id, payment);
    return payment;
  }

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<Payment> {
    const p = this.payments.get(id);
    if (!p) throw new Error("Payment not found");
    p.status = status;
    if (transactionId) p.transactionId = transactionId;
    return p;
  }
}

export class MemoryTransactionRunner implements TransactionRunner {
  constructor(private readonly uow: UnitOfWork) {}

  async run<T>(fn: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return fn(this.uow);
  }
}

export class MemoryAdminRepo implements AdminRepo {
  adminSet: Set<string> = new Set();
  auditLogs: Array<{ id: string; adminUserId: string | null; action: string; targetOrgId?: string | null; createdAt: Date }> = [];

  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.adminSet.has(userId);
  }

  async logAudit(entry: {
    adminUserId: string | null;
    action: string;
    targetOrgId?: string | null;
  }): Promise<void> {
    this.auditLogs.push({
      id: crypto.randomUUID(),
      adminUserId: entry.adminUserId,
      action: entry.action,
      targetOrgId: entry.targetOrgId,
      createdAt: new Date(),
    });
  }

  async addPlatformAdmin(userId: string): Promise<void> {
    this.adminSet.add(userId);
  }
}
