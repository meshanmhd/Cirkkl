import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type UserRole = 'member' | 'organisation'

export interface OrganisationRecord {
  id: string
  name?: string
  org_email?: string
  is_approved: boolean
  is_otp_verified: boolean
  org_otp?: string | null
  [key: string]: any
}

export interface AuthContext {
  userId: string | null
  user: any | null
  role: UserRole | null
  org: OrganisationRecord | null
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      userId: null,
      user: null,
      role: null,
      org: null,
    }
  }

  const adminClient = createAdminClient()
  const { data: orgData } = await adminClient
    .from('organisations')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (orgData) {
    return {
      userId: user.id,
      user,
      role: 'organisation',
      org: orgData as OrganisationRecord,
    }
  }

  return {
    userId: user.id,
    user,
    role: 'member',
    org: null,
  }
}

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { userId: user.id, user }
}

export async function requireOrg(): Promise<{ userId: string; user: any; org: OrganisationRecord }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()
  const { data: orgData, error } = await adminClient
    .from('organisations')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !orgData) {
    redirect('/')
  }

  if (!orgData.is_otp_verified) {
    redirect('/verify-org')
  }

  if (!orgData.is_approved) {
    redirect('/pending-approval')
  }

  return {
    userId: user.id,
    user,
    org: orgData as OrganisationRecord,
  }
}
