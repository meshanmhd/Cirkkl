import { redirect } from 'next/navigation'
import { api } from '@/lib/api'

export type UserRole = 'member' | 'organisation' | 'attendee' | 'organiser'

export interface OrganisationRecord {
  id: string
  name?: string
  org_email?: string
  is_approved: boolean
  is_otp_verified: boolean
  org_otp?: string | null
  [key: string]: unknown
}

export interface AuthUserRecord {
  id: string
  email?: string
  role?: string
  user_metadata?: {
    full_name?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface AuthContext {
  userId: string | null
  user: AuthUserRecord | null
  role: UserRole | null
  org: OrganisationRecord | null
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const me = await api.auth.me()
    const isOrg = me.role === 'organisation' || !!me.org
    const orgRecord: OrganisationRecord | null = isOrg
      ? {
          id: me.userId,
          name: me.user?.name || '',
          org_email: me.email,
          is_approved: me.org?.isApproved ?? false,
          is_otp_verified: me.org?.isOtpVerified ?? false,
        }
      : null

    return {
      userId: me.userId,
      user: {
        id: me.userId,
        email: me.email,
        role: me.role,
        user_metadata: {
          full_name: me.user?.name || (isOrg ? 'Organisation' : undefined),
        },
        ...me.user,
      },
      role: me.role as UserRole,
      org: orgRecord,
    }
  } catch {
    return {
      userId: null,
      user: null,
      role: null,
      org: null,
    }
  }
}

export async function requireUser(): Promise<{ userId: string; user: AuthUserRecord }> {
  const ctx = await getAuthContext()

  if (!ctx.user) {
    redirect('/login')
  }

  return { userId: ctx.userId!, user: ctx.user }
}

export async function requireOrg(): Promise<{ userId: string; user: AuthUserRecord; org: OrganisationRecord }> {
  const ctx = await getAuthContext()

  if (!ctx.user) {
    redirect('/login')
  }

  if (ctx.role !== 'organisation' || !ctx.org) {
    redirect('/')
  }

  if (!ctx.org.is_otp_verified) {
    redirect('/verify-org')
  }

  if (!ctx.org.is_approved) {
    redirect('/pending-approval')
  }

  return {
    userId: ctx.userId!,
    user: ctx.user,
    org: ctx.org,
  }
}
