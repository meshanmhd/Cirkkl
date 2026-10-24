# Backend Migration Inventory

Comprehensive audit of all Supabase call sites across `apps/web`, documenting data layer interactions, database tables touched, runtime contexts, proposed backend-agnostic API operations, and PostgREST-specific constructs.

---

## Call Sites Inventory Table

| File | Line | What It Does | Tables Touched | Runs On | Proposed Operation Name |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `apps/web/middleware.ts` | 33 | Authenticates user session token | Auth Session | Middleware | `auth.me` |
| `apps/web/middleware.ts` | 41 | Checks organization verification and approval status | `organisations` | Middleware | `auth.me` |
| `apps/web/lib/auth/server.ts` | 26 | Resolves current auth user context | Auth Session | Server Component / Action | `auth.me` |
| `apps/web/lib/auth/server.ts` | 39 | Fetches organization record for authenticated user | `organisations` | Server Component / Action | `auth.me` |
| `apps/web/lib/auth/server.ts` | 63 | Asserts authenticated user session | Auth Session | Server Component / Action | `auth.me` |
| `apps/web/lib/auth/server.ts` | 74 | Asserts authenticated user session for org routes | Auth Session | Server Component / Action | `auth.me` |
| `apps/web/lib/auth/server.ts` | 82 | Verifies org status (OTP verified & approved) | `organisations` | Server Component / Action | `auth.me` |
| `apps/web/app/actions/auth.ts` | 15 | Signs in user with email & password | Auth Session | Server Action | `auth.login` |
| `apps/web/app/actions/auth.ts` | 29 | Checks org verification status on login redirect | `organisations` | Server Action | `auth.login` |
| `apps/web/app/actions/auth.ts` | 65 | Creates new user account | Auth Session, `auth.users` | Server Action | `auth.signup` |
| `apps/web/app/actions/auth.ts` | 82 | Creates unapproved organization record | `organisations` | Server Action | `auth.signup` |
| `apps/web/app/actions/auth.ts` | 101 | Terminates user session | Auth Session | Server Action | `auth.logout` |
| `apps/web/app/actions/auth.ts` | 109 | Gets current user for OTP verification | Auth Session | Server Action | `auth.verifyOrgOtp` |
| `apps/web/app/actions/auth.ts` | 116 | Reads stored plain OTP for validation | `organisations` | Server Action | `auth.verifyOrgOtp` |
| `apps/web/app/actions/auth.ts` | 137 | Updates `is_otp_verified=true` and clears `org_otp` | `organisations` | Server Action | `auth.verifyOrgOtp` |
| `apps/web/app/actions/registration.ts` | 22 | Gets current user for invite acceptance | Auth Session | Server Action | `registrations.acceptTeamInvite` |
| `apps/web/app/actions/registration.ts` | 29 | Checks existing user registration status | `registrations` | Server Action | `registrations.acceptTeamInvite` |
| `apps/web/app/actions/registration.ts` | 49 | Bypasses RLS to query team leader | `teams` | Server Action | `registrations.acceptTeamInvite` |
| `apps/web/app/actions/registration.ts` | 60 | Verifies team leader's registration status | `registrations` | Server Action | `registrations.acceptTeamInvite` |
| `apps/web/app/actions/registration.ts` | 76 | Updates team member invite status to approved | `team_members` | Server Action | `registrations.acceptTeamInvite` |
| `apps/web/app/actions/registration.ts` | 110 | Gets current user for event registration | Auth Session | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 137 | Inserts new team record for team events | `teams` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 158 | Checks for prior cancelled/rejected registration | `registrations` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 173 | Rollback: deletes team if previous registration was rejected | `teams` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 180 | Updates existing cancelled registration with new details | `registrations` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 195 | Inserts new event registration | `registrations` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 216 | Rollback: deletes team if registration insertion fails | `teams` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 227 | Inserts approval notification for auto-approved registrations | `notifications` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 240 | Deletes outdated team_invite notifications for event | `notifications` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 254 | Inserts invited team members with pending status | `team_members` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 258 | Rollback: deletes team & registration if team member insert fails | `teams`, `registrations` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 274 | Dispatches `team_invite` notifications to teammates | `notifications` | Server Action | `registrations.register` |
| `apps/web/app/actions/registration.ts` | 282 | Gets current user for tickets retrieval | Auth Session | Server Action | `registrations.myTickets` |
| `apps/web/app/actions/registration.ts` | 290 | Queries user direct approved tickets | `registrations`, `events` | Server Action | `registrations.myTickets` |
| `apps/web/app/actions/registration.ts` | 297 | Queries approved team tickets with PostgREST join | `registrations`, `events`, `teams`, `team_members` | Server Action | `registrations.myTickets` |
| `apps/web/app/actions/members.ts` | 18 | Updates organisation member role | `members` | Server Action | `org.updateMemberRole` |
| `apps/web/app/dashboard/events/[id]/attendance/actions.ts` | 13 | Verifies event organisation ownership | `events` | Server Action | `org.scanAttendance` |
| `apps/web/app/dashboard/events/[id]/attendance/actions.ts` | 24 | Finds registration by ticket code for event | `registrations` | Server Action | `org.scanAttendance` |
| `apps/web/app/dashboard/events/[id]/attendance/actions.ts` | 40 | Fetches user full name and email for check-in | `users` | Server Action | `org.scanAttendance` |
| `apps/web/app/dashboard/events/[id]/attendance/actions.ts` | 63 | Fetches registration by ID | `registrations` | Server Action | `org.confirmAttendance` |
| `apps/web/app/dashboard/events/[id]/attendance/actions.ts` | 74 | Verifies event organisation ownership | `events` | Server Action | `org.confirmAttendance` |
| `apps/web/app/dashboard/events/[id]/attendance/actions.ts` | 83 | Marks participant attended with timestamp | `registrations` | Server Action | `org.confirmAttendance` |
| `apps/web/app/api/payments/create/route.ts` | 8 | Authenticates user for payment order creation | Auth Session | Route Handler | `payments.create` |
| `apps/web/app/api/payments/create/route.ts` | 22 | Reads ticket price and name | `tickets` | Route Handler | `payments.create` |
| `apps/web/app/api/payments/create/route.ts` | 38 | Reads merchant UPI identifier and name | `merchant_settings` | Route Handler | `payments.create` |
| `apps/web/app/api/payments/create/route.ts` | 59 | Inserts pending payment record with generated UPI URI | `payments` | Route Handler | `payments.create` |
| `apps/web/app/notifications/page.tsx` | 55 | Resolves auth user for realtime channel subscription | Auth Session | Client Component | `notifications.stream` |
| `apps/web/app/notifications/page.tsx` | 59 | Establishes Supabase Realtime channel subscription | `notifications` | Client Component | `notifications.stream` |
| `apps/web/app/notifications/page.tsx` | 75 | Resolves auth user for notification list | Auth Session | Client Component | `notifications.list` |
| `apps/web/app/notifications/page.tsx` | 84 | Client deletes notifications older than 30 days | `notifications` | Client Component | `notifications.list` |
| `apps/web/app/notifications/page.tsx` | 90 | Fetches notifications with foreign key join | `notifications`, `events`, `teams` | Client Component | `notifications.list` |
| `apps/web/app/notifications/page.tsx` | 104 | Fetches sender names by sender IDs list | `users` | Client Component | `notifications.list` |
| `apps/web/app/notifications/page.tsx` | 114 | Fetches current user's team invite statuses | `team_members` | Client Component | `notifications.list` |
| `apps/web/app/notifications/page.tsx` | 151 | Client updates all non-invite notifications to read | `notifications` | Client Component | `notifications.markAllRead` |
| `apps/web/app/notifications/page.tsx` | 163 | Client marks single notification read | `notifications` | Client Component | `notifications.markRead` |
| `apps/web/app/notifications/page.tsx` | 168 | Client deletes notification by ID | `notifications` | Client Component | `notifications.delete` |
| `apps/web/app/notifications/page.tsx` | 188 | Client marks invite notification read after accept | `notifications` | Client Component | `registrations.acceptTeamInvite` |
| `apps/web/app/notifications/page.tsx` | 207 | Client directly updates `team_members` to rejected | `team_members` | Client Component | `registrations.declineTeamInvite` |
| `apps/web/app/notifications/page.tsx` | 209 | Client marks invite notification read after decline | `notifications` | Client Component | `registrations.declineTeamInvite` |
| `apps/web/components/ProfilePage.tsx` | 260 | Resolves auth user for saving profile | Auth Session | Client Component | `profile.update` |
| `apps/web/components/ProfilePage.tsx` | 279 | Updates profile row and `is_profile_completed` flag | `profiles` | Client Component | `profile.update` |
| `apps/web/components/ProfilePage.tsx` | 289 | Resolves auth user for avatar upload | Auth Session | Client Component | `uploads.requestUpload` |
| `apps/web/components/ProfilePage.tsx` | 293 | Direct browser upload of avatar to storage | Storage (`profiles`) | Client Component | `uploads.requestUpload` |
| `apps/web/components/ProfilePage.tsx` | 295 | Resolves public URL for uploaded avatar key | Storage (`profiles`) | Client Component | `uploads.requestUpload` |
| `apps/web/components/ProfilePage.tsx` | 296 | Updates profile with avatar public URL | `profiles` | Client Component | `profile.updateAvatar` |
| `apps/web/components/ui/SlideButton.tsx` | 442 | Searches user by CKL QR identifier pattern | `users` | Client Component | `profile.searchByCklId` |
| `apps/web/components/ui/SlideButton.tsx` | 456 | Resolves current auth user to prevent self-addition | Auth Session | Client Component | `profile.searchByCklId` |
| `apps/web/components/ui/SlideButton.tsx` | 464 | Checks if searched teammate is already registered | `registrations` | Client Component | `profile.searchByCklId` |
| `apps/web/components/ui/SlideButton.tsx` | 478 | Checks if teammate is in another team via PostgREST join | `team_members`, `teams` | Client Component | `profile.searchByCklId` |
| `apps/web/components/ui/SlideButton.tsx` | 757 | Fetches user on mount | Auth Session | Client Component | `auth.me` |
| `apps/web/components/ui/SlideButton.tsx` | 760 | Fetches profile completion flag on mount | `profiles` | Client Component | `profile.get` |
| `apps/web/components/ui/SlideButton.tsx` | 763 | Listens for auth state changes | Auth Session | Client Component | `auth.session` |
| `apps/web/components/ui/SlideButton.tsx` | 767 | Fetches profile completion flag on auth change | `profiles` | Client Component | `profile.get` |
| `apps/web/components/ui/SlideButton.tsx` | 816 | Resolves auth user for payment proof upload | Auth Session | Client Component | `uploads.requestUpload` |
| `apps/web/components/ui/SlideButton.tsx` | 826 | Direct browser upload of payment proof receipt | Storage (`payment_proofs`) | Client Component | `uploads.requestUpload` |
| `apps/web/components/ui/SlideButton.tsx` | 830 | Resolves public URL for uploaded payment proof | Storage (`payment_proofs`) | Client Component | `uploads.requestUpload` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 162 | Client deletes event | `events` | Client Component | `events.delete` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 169 | Client toggles event published/draft status | `events` | Client Component | `events.updateStatus` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 176 | Resolves user for registration approval | Auth Session | Client Component | `org.approveRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 179 | Client approves team registrations | `registrations` | Client Component | `org.approveRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 189 | Client inserts approval notifications for team | `notifications` | Client Component | `org.approveRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 191 | Client approves individual registration | `registrations` | Client Component | `org.approveRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 194 | Client inserts approval notification for individual | `notifications` | Client Component | `org.approveRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 205 | Resolves user for registration rejection | Auth Session | Client Component | `org.rejectRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 208 | Client rejects team registrations | `registrations` | Client Component | `org.rejectRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 218 | Client inserts rejection notifications for team | `notifications` | Client Component | `org.rejectRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 220 | Client deletes team invite notifications on rejection | `notifications` | Client Component | `org.rejectRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 226 | Client rejects individual registration | `registrations` | Client Component | `org.rejectRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 229 | Client inserts rejection notification for individual | `notifications` | Client Component | `org.rejectRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 242 | Client cancels team registrations and increments count | `registrations` | Client Component | `org.cancelRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 251 | Client deletes team invite notifications on cancellation | `notifications` | Client Component | `org.cancelRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 257 | Client cancels individual registration and increments count | `registrations` | Client Component | `org.cancelRegistration` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 269 | Client toggles participant attendance flag | `registrations` | Client Component | `org.toggleAttendance` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 282 | Client assigns event role to member | `event_roles` | Client Component | `org.createEventRole` |
| `apps/web/components/dashboard/EventManagePage.tsx` | 291 | Client revokes event role | `event_roles` | Client Component | `org.deleteEventRole` |
| `apps/web/components/dashboard/EventsTable.tsx` | 71 | Client deletes event from table row action | `events` | Client Component | `events.delete` |
| `apps/web/components/dashboard/DashboardTopBar.tsx` | 39 | Signs out user session | Auth Session | Client Component | `auth.logout` |
| `apps/web/components/events/EventsClient.tsx` | 37 | Fetches all published events for client filtering | `events` | Client Component | `events.list` |
| `apps/web/components/landing/FeaturedEvents.tsx` | 20 | Fetches top 3 published featured events | `events` | Server Component | `events.list` |
| `apps/web/components/landing/UpcomingEvents.tsx` | 19 | Fetches top 6 published upcoming events | `events` | Server Component | `events.list` |
| `apps/web/components/layout/ServerNavbar.tsx` | 6 | Resolves user session for navigation bar | Auth Session | Server Component | `auth.me` |
| `apps/web/components/layout/ServerNavbar.tsx` | 11 | Fetches user role and QR code identifier | `users` | Server Component | `auth.me` |
| `apps/web/components/layout/ProfileMenu.tsx` | 50 | Fetches user role and QR code identifier | `users` | Client Component | `auth.me` |
| `apps/web/components/layout/ProfileMenu.tsx` | 78 | Resolves active auth session | Auth Session | Client Component | `auth.me` |
| `apps/web/components/layout/ProfileMenu.tsx` | 86 | Counts unread notifications | `notifications` | Client Component | `notifications.unreadCount` |
| `apps/web/components/layout/ProfileMenu.tsx` | 100 | Listens to auth state changes | Auth Session | Client Component | `auth.session` |
| `apps/web/components/layout/ProfileMenu.tsx` | 121 | Terminates session | Auth Session | Client Component | `auth.logout` |
| `apps/web/app/events/[id]/page.tsx` | 23 | Reads event title for page metadata | `events` | Server Component | `events.get` |
| `apps/web/app/events/[id]/page.tsx` | 32 | Reads full event record | `events` | Server Component | `events.get` |
| `apps/web/app/events/[id]/page.tsx` | 40 | Reads ticket tiers for event | `tickets` | Server Component | `events.get` |
| `apps/web/app/events/[id]/page.tsx` | 51 | Reads exact registration count | `registrations` | Server Component | `events.get` |
| `apps/web/app/events/[id]/page.tsx` | 59 | Resolves auth user | Auth Session | Server Component | `events.get` |
| `apps/web/app/events/[id]/page.tsx` | 63 | Reads current user's registration for event | `registrations` | Server Component | `registrations.getMyRegistration` |
| `apps/web/app/events/[id]/page.tsx` | 77 | Reads host member names and avatars | `members` | Server Component | `events.get` |
| `apps/web/app/profile/page.tsx` | 12 | Resolves auth user for profile route | Auth Session | Server Component | `profile.get` |
| `apps/web/app/profile/page.tsx` | 16 | Reads user QR code, name, and role | `users` | Server Component | `profile.get` |
| `apps/web/app/profile/page.tsx` | 22 | Reads complete profile row | `profiles` | Server Component | `profile.get` |
| `apps/web/app/dashboard/events/page.tsx` | 8 | Asserts org authentication context | Auth Session, `organisations` | Server Component | `events.listForOrg` |
| `apps/web/app/dashboard/events/page.tsx` | 11 | Lists events owned by current organisation | `events` | Server Component | `events.listForOrg` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 11 | Asserts org authentication context | Auth Session, `organisations` | Server Component | `org.getEventRegistrations` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 14 | Fetches event details scoped to org | `events` | Server Component | `org.getEventRegistrations` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 23 | Fetches all event registrations | `registrations` | Server Component | `org.getEventRegistrations` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 35 | Bypasses RLS to fetch teams for event | `teams` | Server Component | `org.getEventRegistrations` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 42 | Bypasses RLS to fetch team members | `team_members` | Server Component | `org.getEventRegistrations` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 58 | Bypasses RLS to fetch participant user profiles | `users` | Server Component | `org.getEventRegistrations` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 65 | Fetches org members for role assignment | `members` | Server Component | `org.getEventRoles` |
| `apps/web/app/dashboard/events/[id]/page.tsx` | 70 | Fetches assigned event roles | `event_roles` | Server Component | `org.getEventRoles` |
| `apps/web/app/dashboard/events/new/page.tsx` | 282 | Resolves current auth user | Auth Session | Client Component | `org.listMembers` |
| `apps/web/app/dashboard/events/new/page.tsx` | 285 | Fetches org members available as event hosts | `members` | Client Component | `org.listMembers` |
| `apps/web/app/dashboard/events/new/page.tsx` | 350 | Uploads banner, poster, and speaker images directly to storage | Storage (`events`) | Client Component | `uploads.requestUpload` |
| `apps/web/app/dashboard/events/new/page.tsx` | 355 | Resolves public URLs for uploaded images | Storage (`events`) | Client Component | `uploads.requestUpload` |
| `apps/web/app/dashboard/events/new/page.tsx` | 408 | Fetches organisation name for organizer field | `organisations` | Client Component | `events.create` |
| `apps/web/app/dashboard/events/new/page.tsx` | 413 | Inserts event row directly from client | `events` | Client Component | `events.create` |
| `apps/web/app/dashboard/events/new/page.tsx` | 467 | Inserts tickets rows directly from client | `tickets` | Client Component | `events.create` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 285 | Resolves current auth user | Auth Session | Client Component | `org.listMembers` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 289 | Fetches org members available as event hosts | `members` | Client Component | `org.listMembers` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 353 | Uploads edited banner, poster, and speaker images directly to storage | Storage (`events`) | Client Component | `uploads.requestUpload` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 358 | Resolves public URLs for uploaded images | Storage (`events`) | Client Component | `uploads.requestUpload` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 365 | Fetches event record to populate edit form | `events` | Client Component | `events.get` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 454 | Updates event row directly from client | `events` | Client Component | `events.update` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 499 | Client deletes all existing tickets for event | `tickets` | Client Component | `events.update` |
| `apps/web/app/dashboard/events/[id]/edit/page.tsx` | 511 | Client inserts updated tickets for event | `tickets` | Client Component | `events.update` |
| `apps/web/app/dashboard/events/[id]/attendance/page.tsx` | 10 | Asserts org authentication context | Auth Session, `organisations` | Server Component | `org.scanAttendance` |
| `apps/web/app/dashboard/events/[id]/attendance/page.tsx` | 14 | Verifies event org ownership | `events` | Server Component | `org.scanAttendance` |
| `apps/web/app/dashboard/members/page.tsx` | 7 | Asserts org authentication context | Auth Session, `organisations` | Server Component | `org.listMembers` |
| `apps/web/app/dashboard/members/page.tsx` | 10 | Lists organisation members | `members` | Server Component | `org.listMembers` |

---

## PostgREST-Specific Constructs

The following call sites rely on Supabase / PostgREST-specific syntax that cannot be ported literally to standard HTTP endpoints or generic SQL/ORMs:

1. **Embedded Selects with `!inner` filtering on nested relations**:
   - `apps/web/app/actions/registration.ts:298`:
     ```typescript
     .select("ticket_code, event_id, status, events(title), team:teams!inner(id, team_members!inner(user_id, status))")
     .eq("team.team_members.user_id", user.id)
     .eq("team.team_members.status", "approved")
     .eq("status", "approved")
     ```
     PostgREST performs an inner join filter across multiple relation levels and nests the output in a JSON tree. In standard architecture, this translates to an explicit relational join in `RegistrationRepo.findUserTickets(userId)`.
   - `apps/web/components/ui/SlideButton.tsx:480`:
     ```typescript
     .select('id, status, teams!inner(event_id)')
     .eq('teams.event_id', event.id)
     .eq('user_id', data.id)
     ```
     Uses `!inner` on `teams` relation to check whether a user has active team memberships for a given event. In a backend-agnostic service, this maps to `teamRepo.hasActiveTeamMembership(userId, eventId)`.

2. **Foreign Key Resource Embedding without Explicit Join**:
   - `apps/web/app/notifications/page.tsx:91`:
     ```typescript
     .select(`
       id, type, read, created_at, sender_id, event_id, team_id,
       event:events(title),
       team:teams(name)
     `)
     ```
     PostgREST auto-detects foreign keys to embed related `events` and `teams` rows with renamed keys. Standard REST contracts should return structured DTOs populated by the service layer.

3. **Supabase Realtime Channel Subscription**:
   - `apps/web/app/notifications/page.tsx:59`:
     ```typescript
     supabase.channel(channelName)
       .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, ...)
     ```
     Direct client-to-PostgreSQL WAL change broadcast. In the new architecture, this is encapsulated behind `RealtimeProvider` / Server-Sent Events (SSE) `GET /api/v1/notifications/stream`.

4. **Client-Side Storage Direct S3/Blob Access**:
   - `apps/web/components/ProfilePage.tsx:293`, `SlideButton.tsx:826`, `new/page.tsx:350`, `edit/page.tsx:353`:
     Direct browser file uploads to Supabase storage buckets (`profiles`, `events`, `payment_proofs`) storing and exposing public bucket URLs. Replaced by `StorageProvider.createUploadTarget` generating pre-signed upload URLs and storing storage keys rather than absolute public URLs.

---

## Issues Found (Suspected Bugs in Existing Implementation)

1. **Hardcoded Cutoff Date for Event Filtering**:
   In `apps/web/components/events/EventsClient.tsx:67`:
   `const now = new Date("Aug 12, 2025").getTime();`
   The filter for "Upcoming" versus "Past" events hardcodes `Aug 12, 2025` instead of using the current date `new Date().getTime()`. Consequently, any event occurring after August 2025 is perpetually categorized as "Upcoming".

2. **Orphaned Auth User on Organisation Signup Failure**:
   In `apps/web/app/actions/auth.ts:80-92`:
   If `supabase.auth.signUp()` succeeds but the subsequent insert into `organisations` fails, the error is merely logged to `console.error` without rolling back the auth user. The user is left in an unrecoverable state where they cannot access user routes nor complete organization verification.

3. **Insecure Plaintext OTP Storage**:
   In `apps/web/app/actions/auth.ts:125-130`:
   `organisations.org_otp` stores the one-time verification password in plaintext in the database rather than a salted cryptographic hash.

4. **Non-Transactional Multi-Step Operations**:
   In `apps/web/app/actions/registration.ts:135-275`:
   Registration creates a team, creates/updates registration, dispatches notifications, and inserts team members sequentially without database transactions. If any step fails, ad-hoc `supabase.from('teams').delete()` calls attempt cleanup, but network/process interruptions leave inconsistent orphaned state.
   Similarly in `apps/web/app/dashboard/events/[id]/edit/page.tsx:499-511`, tickets are deleted with `delete().eq('event_id', eventId)` before inserting updated tickets. Any failure during re-insertion leaves the event without any tickets.

5. **Client-Side Notification Cleanup**:
   In `apps/web/app/notifications/page.tsx:84-87`:
   The browser client executes `supabase.from('notifications').delete().lt('created_at', thirtyDaysAgo)` on page load. Routine maintenance data cleanup should be handled by a scheduled server job or cron task, not user-driven client components.

6. **Direct Client Database Mutation Vulnerabilities**:
   In `apps/web/components/dashboard/EventManagePage.tsx` and `apps/web/app/notifications/page.tsx`:
   Actions such as approving/rejecting registrations, toggling attendance, assigning/deleting event roles, and updating team member statuses are issued directly from client components rather than through authorized server actions or API endpoints.
