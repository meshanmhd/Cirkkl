-- Authz Hardening Migration
-- Adds organisations.is_otp_verified, revokes unprivileged UPDATE/SELECT on sensitive columns,
-- and documents required RLS policies.

-- 1. Add is_otp_verified column if it doesn't already exist
ALTER TABLE IF EXISTS organisations
  ADD COLUMN IF NOT EXISTS is_otp_verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Revoke direct column updates from authenticated users on sensitive fields
-- Users should never be able to update their own approval status, otp verification status, or custom OTP.
REVOKE UPDATE (is_approved, is_otp_verified, org_otp) ON organisations FROM authenticated;
REVOKE UPDATE (is_approved, is_otp_verified, org_otp) ON organisations FROM anon;

-- 3. Revoke SELECT on org_otp column from authenticated and anon roles
-- Only the service_role (admin client) should be able to read or verify the org_otp
REVOKE SELECT (org_otp) ON organisations FROM authenticated;
REVOKE SELECT (org_otp) ON organisations FROM anon;

/*
================================================================================
REQUIRED ROW LEVEL SECURITY (RLS) POLICIES AUDIT & INVENTORY
================================================================================

To check and dump your live RLS policies, run the following SQL query in the Supabase SQL Editor:

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

The following RLS policies MUST exist for proper authorization hardening:

1. TABLE: organisations
   - ENABLE ROW LEVEL SECURITY;
   - SELECT: Allow authenticated users to select public organisation profile details:
     CREATE POLICY "organisations_select_authenticated"
       ON organisations FOR SELECT
       TO authenticated
       USING (true);
     (Note: column-level REVOKE prevents reading org_otp even if SELECT policy allows row access)
   - UPDATE: Allow organisation admin to update own non-sensitive info:
     CREATE POLICY "organisations_update_own"
       ON organisations FOR UPDATE
       TO authenticated
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);
     (Column-level REVOKE prevents modifying is_approved, is_otp_verified, or org_otp)

2. TABLE: events
   - ENABLE ROW LEVEL SECURITY;
   - SELECT: Allow anyone or authenticated to view published events (or own draft events):
     CREATE POLICY "events_select_policy"
       ON events FOR SELECT
       USING (status = 'published' OR auth.uid() = org_id);
   - INSERT: Allow approved and verified organisations to insert events:
     CREATE POLICY "events_insert_org"
       ON events FOR INSERT
       TO authenticated
       WITH CHECK (
         auth.uid() = org_id AND
         EXISTS (
           SELECT 1 FROM organisations
           WHERE id = auth.uid()
             AND is_approved = true
             AND is_otp_verified = true
         )
       );
   - UPDATE: Allow organisations to update only their own events:
     CREATE POLICY "events_update_org"
       ON events FOR UPDATE
       TO authenticated
       USING (auth.uid() = org_id)
       WITH CHECK (auth.uid() = org_id);
   - DELETE: Allow organisations to delete only their own events:
     CREATE POLICY "events_delete_org"
       ON events FOR DELETE
       TO authenticated
       USING (auth.uid() = org_id);

3. TABLE: registrations
   - ENABLE ROW LEVEL SECURITY;
   - SELECT: Allow user to view their own registrations AND event owners to view registrations for their events:
     CREATE POLICY "registrations_select_user_or_event_owner"
       ON registrations FOR SELECT
       TO authenticated
       USING (
         auth.uid() = user_id OR
         EXISTS (
           SELECT 1 FROM events
           WHERE events.id = registrations.event_id
             AND events.org_id = auth.uid()
         )
       );
   - UPDATE: Event organizers can update registrations (e.g. approve/reject/attended) for their events only:
     CREATE POLICY "registrations_update_event_owner"
       ON registrations FOR UPDATE
       TO authenticated
       USING (
         EXISTS (
           SELECT 1 FROM events
           WHERE events.id = registrations.event_id
             AND events.org_id = auth.uid()
         )
       )
       WITH CHECK (
         EXISTS (
           SELECT 1 FROM events
           WHERE events.id = registrations.event_id
             AND events.org_id = auth.uid()
         )
       );

4. TABLE: members
   - ENABLE ROW LEVEL SECURITY;
   - SELECT: Allow members and org owners to view members of that org:
     CREATE POLICY "members_select"
       ON members FOR SELECT
       TO authenticated
       USING (auth.uid() = org_id OR auth.uid() = id);
   - UPDATE: Only the organisation owner can update member roles:
     CREATE POLICY "members_update_org"
       ON members FOR UPDATE
       TO authenticated
       USING (auth.uid() = org_id)
       WITH CHECK (auth.uid() = org_id);

================================================================================
*/
