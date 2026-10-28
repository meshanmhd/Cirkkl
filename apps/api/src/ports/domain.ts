export type UserRole = "member" | "organisation" | "attendee" | "organiser" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt?: Date;
}

export type OrgStatus = "pending" | "approved" | "rejected";

export interface Organisation {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  status: OrgStatus;
  isOtpVerified: boolean;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  otpFailedAttempts?: number;
  phone?: string | null;
  website?: string | null;
  logoKey?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Member {
  id: string;
  organisationId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  avatarKey?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventVisibility = "public" | "unlisted" | "private";

export interface Speaker {
  name: string;
  designation?: string;
  avatarKey?: string;
  avatarUrl?: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "file";
  required: boolean;
  options?: string[];
}

export interface EventHost {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface Event {
  id: string;
  organisationId: string;
  title: string;
  slug: string;
  description: string;
  tagline?: string | null;
  category?: string | null;
  organizer?: string | null;
  venue?: string | null;
  city?: string | null;
  startDate: Date;
  endDate?: Date | null;
  time?: string | null;
  endTime?: string | null;
  location?: string | null;
  locationType?: "physical" | "online" | "hybrid" | null;
  locationLink?: string | null;
  meetingLink?: string | null;
  platform?: string | null;
  registrationDeadline?: Date | null;
  registrationEndTime?: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  isFeatured: boolean;
  isPaid: boolean;
  price?: "free" | "paid" | null;
  priceAmount?: number | null;
  seats?: number | null;
  seatsAvailable?: number | null;
  approvalRequired?: boolean | null;
  cancellationPolicy?: string | null;
  refundPolicy?: string | null;
  photographyPolicy?: string | null;
  tags?: string[];
  isTeamEvent: boolean;
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
  bannerKey?: string | null;
  posterKey?: string | null;
  bannerUrl?: string | null;
  posterUrl?: string | null;
  speakers?: Speaker[];
  customFields?: CustomField[];
  hosts?: EventHost[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface Ticket {
  id: string;
  eventId: string;
  name: string;
  price: number;
  currency: string;
  totalQuantity: number | null;
  availableQuantity: number | null;
  unlimited?: boolean;
  createdAt: Date;
}

export type RegistrationStatus = "pending" | "approved" | "rejected" | "cancelled" | "attended";

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  ticketId?: string | null;
  ticketCode: string;
  status: RegistrationStatus;
  attended: boolean;
  attendedAt?: Date | null;
  isTeam: boolean;
  teamId?: string | null;
  fieldValues?: Record<string, string>;
  transactionId?: string | null;
  paymentProofKey?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Team {
  id: string;
  eventId: string;
  leaderId: string;
  name: string;
  createdAt: Date;
}

export type TeamMemberStatus = "pending" | "approved" | "rejected";

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  status: TeamMemberStatus;
  createdAt: Date;
}

export type NotificationType = "team_invite" | "registration_approved" | "registration_rejected" | "general";
export type NotificationInviteStatus = "pending" | "approved" | "rejected";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  eventId?: string | null;
  eventTitle?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  senderId?: string | null;
  senderName?: string | null;
  inviteStatus?: NotificationInviteStatus | null;
  createdAt: Date;
}

export interface Profile {
  userId: string;
  email: string;
  fullName?: string | null;
  cklId?: string | null;
  college?: string | null;
  branch?: string | null;
  academicYear?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  avatarKey?: string | null;
  avatarUrl?: string | null;
  isProfileCompleted: boolean;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface College {
  id?: string;
  name: string;
  city?: string;
  state?: string;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  orderReference: string;
  userId: string;
  eventId: string;
  ticketId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string | null;
  merchantUpiId?: string | null;
  merchantName?: string | null;
  upiUri: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MerchantSettings {
  upiId: string;
  merchantName: string;
}

export type UploadTargetType = "profile_image" | "event_image" | "payment_proof";

export interface UploadTarget {
  key: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  headers?: Record<string, string>;
  publicUrl?: string;
  expiresAt: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string | null;
}
