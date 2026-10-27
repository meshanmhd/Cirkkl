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
  email?: string | null
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
    console.log('[getAuthContext] API response:', JSON.stringify(me, null, 2))
    
    const isOrg = me.role === 'organisation' || !!me.org
    const orgRecord: OrganisationRecord | null = isOrg
      ? {
          id: me.userId,
          name: me.org?.name || me.user?.name || '',
          org_email: me.email || '',
          is_approved: me.org?.isApproved ?? false,
          is_otp_verified: me.org?.isOtpVerified ?? false,
        }
      : null

    console.log('[getAuthContext] Returning:', {
      userId: me.userId,
      hasUser: true,
      role: me.role,
      hasOrg: !!orgRecord,
      orgName: orgRecord?.name
    })

    return {
      userId: me.userId,
      user: {
        id: me.userId,
        role: me.role,
        user_metadata: {
          full_name: me.org?.name || me.user?.name || (isOrg ? 'Organisation' : undefined),
        },
        ...me.user,
        email: me.user?.email || me.email || '',
      },
      role: me.role as UserRole,
      org: orgRecord,
    }
  } catch (error) {
    console.error('[getAuthContext] Error:', error)
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

  // NOTE: OTP and approval redirects are handled by middleware to avoid cascading redirects.
  // The layout should not perform redirects that middleware already handles.
  // This prevents the "too many attempts to navigate" error.

  return {
    userId: ctx.userId!,
    user: ctx.user,
    org: ctx.org,
  }
}
