# Security Policy & Authorization Guidelines

## Core Principles

1. **Never Trust `user_metadata` for Authorization**
   - Supabase `user_metadata` is writable by clients from the browser via `supabase.auth.updateUser({ data: ... })`.
   - Never use fields stored in `user_metadata` (e.g., `role`, `is_otp_verified`, `is_approved`) for authorization decisions, access gates, or permission checks.
   - All roles, verification states, and administrative flags must be stored in database tables (e.g., `organisations`, `users`) with proper column-level privileges and Row Level Security (RLS) enforcement.

2. **Authorize Server-Side in `requireOrg()` and `requireUser()`**
   - Always authorize requests on the server using `lib/auth/server.ts`.
   - Use `requireOrg()` in every server action, route handler, and dashboard page that touches organisation data.
   - `requireOrg()` verifies the user's session against the database `organisations` record (`is_otp_verified === true` and `is_approved === true`). If not satisfied, it fails closed (redirects or throws).

3. **Never Pass Identity from the Client**
   - Never accept identifiers like `orgId` or `userId` as trusted parameters from client requests when performing privileged actions or scoping database queries.
   - Derive the actor's identity and organisation ID directly from `requireOrg()` / `requireUser()` / session tokens.
   - Verify object ownership (e.g., `event.org_id === org.id`, registration belongs to event) before reading or updating records.

4. **Constant-Time Verification for Secrets**
   - Always compare OTPs, secret tokens, and hashes using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
   - Sensitive columns like `org_otp` must not be selectable by authenticated or anon roles.
