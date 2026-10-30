import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env";
import { errorHandler } from "./routes/middleware/error";
import { createAuthMiddleware } from "./routes/middleware/auth";
import { SupabaseAuthProvider } from "./adapters/supabase/auth.provider";
import { SupabaseStorageProvider } from "./adapters/supabase/storage.provider";
import { InProcessRealtimeProvider } from "./adapters/supabase/realtime.provider";
import { createKyselyDatabase } from "./adapters/kysely/database";
import { KyselyEventRepo } from "./adapters/kysely/event.repo";
import { KyselyTicketRepo } from "./adapters/kysely/ticket.repo";
import { KyselyRegistrationRepo } from "./adapters/kysely/registration.repo";
import { KyselyTeamRepo } from "./adapters/kysely/team.repo";
import { KyselyOrganisationRepo } from "./adapters/kysely/organisation.repo";
import { KyselyMemberRepo } from "./adapters/kysely/member.repo";
import { KyselyNotificationRepo } from "./adapters/kysely/notification.repo";
import { KyselyProfileRepo } from "./adapters/kysely/profile.repo";
import { KyselyPaymentRepo } from "./adapters/kysely/payment.repo";
import { KyselyTransactionRunner } from "./adapters/kysely/transaction.runner";
import { KyselyAdminRepo } from "./adapters/kysely/admin.repo";
import { MemoryAuthProvider } from "./adapters/memory/fake-auth.provider";
import { MemoryStorageProvider } from "./adapters/memory/fake-storage.provider";
import { MemoryRealtimeProvider } from "./adapters/memory/fake-realtime.provider";
import {
  MemoryAdminRepo,
  MemoryEventRepo,
  MemoryMemberRepo,
  MemoryNotificationRepo,
  MemoryOrganisationRepo,
  MemoryPaymentRepo,
  MemoryProfileRepo,
  MemoryRegistrationRepo,
  MemoryTeamRepo,
  MemoryTicketRepo,
  MemoryTransactionRunner,
} from "./adapters/memory/fake-repos";
import { AuthService } from "./services/auth.service";
import { EventService } from "./services/event.service";
import { RegistrationService } from "./services/registration.service";
import { OrgService } from "./services/org.service";
import { NotificationService } from "./services/notification.service";
import { ProfileService } from "./services/profile.service";
import { PaymentService } from "./services/payment.service";
import { UploadService } from "./services/upload.service";
import { AdminService } from "./services/admin.service";
import { createAuthRoutes } from "./routes/auth.routes";
import { createEventsRoutes, createOrgEventsRoutes } from "./routes/events.routes";
import { createRegistrationsRoutes } from "./routes/registrations.routes";
import { createOrgRoutes } from "./routes/org.routes";
import { createNotificationsRoutes } from "./routes/notifications.routes";
import { createCollegeRoutes, createProfileRoutes } from "./routes/profile.routes";
import { createPaymentsRoutes } from "./routes/payments.routes";
import { createUploadsRoutes } from "./routes/uploads.routes";
import { createAdminRoutes } from "./routes/admin.routes";

export function createContainer(adapterOverride?: "supabase" | "memory") {
  const adapter = adapterOverride || env.BACKEND_ADAPTER;

  let authProvider: any;
  let storageProvider: any;
  let realtimeProvider: any;
  let eventRepo: any;
  let ticketRepo: any;
  let registrationRepo: any;
  let teamRepo: any;
  let orgRepo: any;
  let memberRepo: any;
  let notificationRepo: any;
  let profileRepo: any;
  let paymentRepo: any;
  let transactionRunner: any;
  let adminRepo: any;

  if (adapter === "supabase") {
    authProvider = new SupabaseAuthProvider(
      env.SUPABASE_URL || "https://example.supabase.co",
      env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-key"
    );
    storageProvider = new SupabaseStorageProvider(
      env.SUPABASE_URL || "https://example.supabase.co",
      env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-key"
    );
    realtimeProvider = new InProcessRealtimeProvider();

    const db = createKyselyDatabase(env.DATABASE_URL);
    eventRepo = new KyselyEventRepo(db);
    ticketRepo = new KyselyTicketRepo(db);
    registrationRepo = new KyselyRegistrationRepo(db);
    teamRepo = new KyselyTeamRepo(db);
    orgRepo = new KyselyOrganisationRepo(db);
    memberRepo = new KyselyMemberRepo(db);
    notificationRepo = new KyselyNotificationRepo(db);
    profileRepo = new KyselyProfileRepo(db);
    paymentRepo = new KyselyPaymentRepo(db);
    transactionRunner = new KyselyTransactionRunner(db);
    adminRepo = new KyselyAdminRepo(db);
  } else {
    authProvider = new MemoryAuthProvider();
    storageProvider = new MemoryStorageProvider();
    realtimeProvider = new MemoryRealtimeProvider();

    eventRepo = new MemoryEventRepo();
    registrationRepo = new MemoryRegistrationRepo();
    ticketRepo = new MemoryTicketRepo(registrationRepo);
    teamRepo = new MemoryTeamRepo();
    orgRepo = new MemoryOrganisationRepo();
    memberRepo = new MemoryMemberRepo();
    notificationRepo = new MemoryNotificationRepo();
    profileRepo = new MemoryProfileRepo();
    paymentRepo = new MemoryPaymentRepo();
    adminRepo = new MemoryAdminRepo();

    transactionRunner = new MemoryTransactionRunner({
      eventRepo,
      ticketRepo,
      registrationRepo,
      teamRepo,
      notificationRepo,
    });
  }

  const authService = new AuthService(authProvider, orgRepo, profileRepo);
  const eventService = new EventService(eventRepo, ticketRepo, transactionRunner, memberRepo);
  const registrationService = new RegistrationService(
    registrationRepo,
    eventRepo,
    ticketRepo,
    teamRepo,
    notificationRepo,
    transactionRunner,
    memberRepo
  );
  const orgService = new OrgService(
    eventRepo,
    registrationRepo,
    ticketRepo,
    teamRepo,
    memberRepo,
    profileRepo,
    notificationRepo,
    transactionRunner
  );
  const notificationService = new NotificationService(notificationRepo, realtimeProvider);
  const profileService = new ProfileService(profileRepo, storageProvider);
  const paymentService = new PaymentService(paymentRepo, ticketRepo);
  const uploadService = new UploadService(storageProvider);
  const adminService = new AdminService(adminRepo, orgRepo);

  const app = new Hono();

  const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          return origin || "*";
        }
        return allowedOrigins[0];
      },
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use("*", createAuthMiddleware(authService));
  app.onError(errorHandler);

  app.get("/health", (c) => c.json({ status: "ok" }));

  const v1 = new Hono();
  v1.route("/auth", createAuthRoutes(authService));
  v1.route("/events", createEventsRoutes(eventService));
  v1.route("/org/events", createOrgEventsRoutes(eventService));
  v1.route("/", createRegistrationsRoutes(registrationService));
  v1.route("/org", createOrgRoutes(orgService));
  v1.route("/notifications", createNotificationsRoutes(notificationService));
  v1.route("/profile", createProfileRoutes(profileService));
  v1.route("/colleges", createCollegeRoutes(profileService));
  v1.route("/payments", createPaymentsRoutes(paymentService));
  v1.route("/uploads", createUploadsRoutes(uploadService));
  v1.route("/admin", createAdminRoutes(adminService, adminRepo));

  app.route("/api/v1", v1);

  return {
    app,
    services: {
      authService,
      eventService,
      registrationService,
      orgService,
      notificationService,
      profileService,
      paymentService,
      uploadService,
      adminService,
    },
    ports: {
      authProvider,
      storageProvider,
      realtimeProvider,
      eventRepo,
      ticketRepo,
      registrationRepo,
      teamRepo,
      orgRepo,
      memberRepo,
      notificationRepo,
      profileRepo,
      paymentRepo,
      transactionRunner,
      adminRepo,
    },
  };
}
