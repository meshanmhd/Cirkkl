'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { api, getErrorMessage } from '@/lib/api'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, getCookieOptions } from '@/lib/auth/cookies'

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string

  try {
    const res = await api.auth.login({ email, password })
    const cookieStore = await cookies()
    cookieStore.set(ACCESS_TOKEN_COOKIE, res.accessToken, getCookieOptions(false))
    cookieStore.set(REFRESH_TOKEN_COOKIE, res.refreshToken, getCookieOptions(true))

    revalidatePath('/', 'layout')

    const isOrg = res.user?.role === 'organisation' || !!res.orgStatus
    if (isOrg) {
      if (res.orgStatus && !res.orgStatus.isOtpVerified) {
        redirect('/verify-org')
      }
      if (res.orgStatus && !res.orgStatus.isApproved) {
        redirect('/pending-approval')
      }
      redirect('/dashboard/events')
    }

    if (redirectTo) {
      redirect(redirectTo)
    }
    redirect('/')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    return { error: getErrorMessage(err, 'Invalid email or password.') }
  }
}

export async function signupAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('name') as string
  const roleInput = formData.get('role') as string
  const role = roleInput === 'organisation' ? 'organisation' : 'member'

  try {
    const res = await api.auth.signup({
      email,
      password,
      name: fullName,
      role,
      orgName: role === 'organisation' ? fullName : undefined,
    })

    if (res.accessToken && res.refreshToken) {
      const cookieStore = await cookies()
      cookieStore.set(ACCESS_TOKEN_COOKIE, res.accessToken, getCookieOptions(false))
      cookieStore.set(REFRESH_TOKEN_COOKIE, res.refreshToken, getCookieOptions(true))
    }

    revalidatePath('/', 'layout')
    redirect(`/check-email?email=${encodeURIComponent(email)}`)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    return { error: getErrorMessage(err, 'Failed to sign up.') }
  }
}

export async function signOutAction() {
  try {
    await api.auth.logout()
  } catch {}

  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function verifyOrgOtpAction(otpCode: string) {
  try {
    await api.auth.verifyOrgOtp(otpCode)
    revalidatePath('/', 'layout')
    redirect('/pending-approval')
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err
    }
    return { error: getErrorMessage(err, 'Failed to verify code.') }
  }
}
