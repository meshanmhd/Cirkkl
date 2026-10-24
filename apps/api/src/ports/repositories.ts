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
} from "./domain";

export interface EventRepo {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  findPublicByIdOrSlug(idOrSlug: string): Promise<Event | null>;
  findOrgEvent(id: string, orgId: string): Promise<Event | null>;
  findPublicEvents(filters: {
    search?: string;
    category?: string;
    timeFilter?: "upcoming" | "past" | "all";
    cursor?: string;
    limit?: number;
  }): Promise<{ items: Event[]; nextCursor: string | null }>;
  findMany(
    filters?: {
      status?: EventStatus;
      isFeatured?: boolean;
      search?: string;
      startDateGte?: Date;
      orgId?: string;
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Event>>;
  findOrgEvents(
    orgId: string,
    filters?: { search?: string; status?: string; cursor?: string; limit?: number }
  ): Promise<{ items: Event[]; nextCursor: string | null }>;
  create(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event>;
  update(id: string, data: Partial<Event>): Promise<Event>;
  delete(id: string): Promise<void>;
  findHosts(eventId: string): Promise<EventHost[]>;
  findRoles(
    eventId: string
  ): Promise<Array<{ id: string; eventId: string; userId: string; role: string }>>;
  assignRole(
    eventId: string,
    userId: string,
    role: string
  ): Promise<{ id: string; eventId: string; userId: string; role: string }>;
  removeRole(eventId: string, roleId: string): Promise<void>;
}

export interface TicketRepo {
  findById(id: string): Promise<Ticket | null>;
  findByEventId(eventId: string): Promise<Ticket[]>;
  create(data: Omit<Ticket, "id" | "createdAt">): Promise<Ticket>;
  createMany(data: Array<Omit<Ticket, "id" | "createdAt">>): Promise<Ticket[]>;
  update(id: string, data: Partial<Ticket>): Promise<Ticket>;
  delete(id: string): Promise<void>;
  decrementAvailable(id: string, quantity: number): Promise<void>;
  hasRegistrationsOrPayments(ticketId: string): Promise<boolean>;
}

export interface RegistrationRepo {
  findById(id: string): Promise<Registration | null>;
  findByTicketCode(ticketCode: string): Promise<Registration | null>;
  findByUserAndEvent(userId: string, eventId: string): Promise<Registration | null>;
  findMine(userId: string, eventId: string): Promise<Registration | null>;
  lookupTeammate(
    eventId: string,
    cklId: string
  ): Promise<{ id: string; displayName: string; isRegistered: boolean; isInTeam: boolean } | null>;
  findByEvent(
    eventId: string,
    filters?: { status?: RegistrationStatus; search?: string },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Registration>>;
  findUserTickets(
    userId: string
  ): Promise<Array<Registration & { eventTitle: string; eventDate?: Date }>>;
  countByEvent(eventId: string, status?: RegistrationStatus): Promise<number>;
  create(
    data: Omit<Registration, "id" | "createdAt" | "updatedAt">
  ): Promise<Registration>;
  update(id: string, data: Partial<Registration>): Promise<Registration>;
  delete(id: string): Promise<void>;
}

export interface TeamRepo {
  findById(id: string): Promise<Team | null>;
  findByLeaderAndEvent(leaderId: string, eventId: string): Promise<Team | null>;
  findActiveMembership(userId: string, eventId: string): Promise<TeamMember | null>;
  findByEvent(eventId: string): Promise<Team[]>;
  create(data: { name: string; eventId: string; leaderId: string }): Promise<Team>;
  delete(id: string): Promise<void>;
  findMembers(teamId: string): Promise<TeamMember[]>;
  addMember(data: {
    teamId: string;
    userId: string;
    status: TeamMemberStatus;
  }): Promise<TeamMember>;
  updateMemberStatus(
    teamId: string,
    userId: string,
    status: TeamMemberStatus
  ): Promise<TeamMember>;
  removeMember(teamId: string, userId: string): Promise<void>;
}

export interface OrganisationRepo {
  findById(id: string): Promise<Organisation | null>;
  findByOwnerId(ownerId: string): Promise<Organisation | null>;
  create(
    data: Omit<Organisation, "id" | "createdAt" | "updatedAt">
  ): Promise<Organisation>;
  update(id: string, data: Partial<Organisation>): Promise<Organisation>;
  verifyOtp(orgId: string, otp: string): Promise<boolean>;
}

export interface MemberRepo {
  findById(id: string): Promise<Member | null>;
  findByOrgAndUser(orgId: string, userId: string): Promise<Member | null>;
  findManyByOrg(
    orgId: string,
    filters?: { search?: string; department?: string; role?: string },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Member>>;
  create(data: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<Member>;
  updateRole(memberId: string, role: string): Promise<Member>;
  delete(id: string): Promise<void>;
}

export interface NotificationRepo {
  findById(id: string): Promise<Notification | null>;
  findByUser(
    userId: string,
    filters?: {
      type?: NotificationType;
      filter?: "all" | "invites" | "general";
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;
  create(data: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  createMany(
    data: Array<Omit<Notification, "id" | "createdAt">>
  ): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<number>;
  delete(id: string, userId: string): Promise<void>;
  deleteOldNotifications(userId: string, olderThanDays: number): Promise<number>;
  deleteByEventAndTeam(
    eventId: string,
    teamId: string,
    type: NotificationType
  ): Promise<number>;
  countUnread(userId: string): Promise<number>;
}

export interface ProfileRepo {
  findByUserId(userId: string): Promise<Profile | null>;
  findByCklId(cklId: string): Promise<Profile | null>;
  create(data: Omit<Profile, "createdAt" | "updatedAt">): Promise<Profile>;
  update(userId: string, data: Partial<Profile>): Promise<Profile>;
  updateAvatar(userId: string, avatarKey: string): Promise<string>;
  searchColleges(query: string, limit?: number): Promise<College[]>;
}

export interface PaymentRepo {
  findById(id: string): Promise<Payment | null>;
  findByOrderReference(orderReference: string): Promise<Payment | null>;
  getMerchantSettings(): Promise<MerchantSettings>;
  create(data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment>;
  updateStatus(
    id: string,
    status: PaymentStatus,
    transactionId?: string
  ): Promise<Payment>;
}

export interface UnitOfWork {
  eventRepo: EventRepo;
  ticketRepo: TicketRepo;
  registrationRepo: RegistrationRepo;
  teamRepo: TeamRepo;
  notificationRepo: NotificationRepo;
}

export interface TransactionRunner {
  run<T>(fn: (uow: UnitOfWork) => Promise<T>): Promise<T>;
}
