'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const userId = data?.user?.id
  let orgData: { id: string; is_otp_verified?: boolean; is_approved?: boolean } | null = null
  if (userId) {
    const admin = createAdminClient()
    const { data: orgRecord } = await admin
      .from('organisations')
      .select('id, is_otp_verified, is_approved')
      .eq('id', userId)
      .maybeSingle()
    if (orgRecord) {
      orgData = orgRecord
    }
  }

  revalidatePath('/', 'layout')

  if (orgData) {
    if (!orgData.is_otp_verified) {
      redirect('/verify-org')
    }
    if (!orgData.is_approved) {
      redirect('/pending-approval')
    }
    redirect('/dashboard/events')
  }

  if (redirectTo) {
    redirect(redirectTo)
  }
  redirect('/')
}

export async function signupAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('name') as string
  const roleInput = formData.get('role') as string
  const role = roleInput === 'organisation' ? 'organisation' : 'member'

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  if (role === 'organisation' && data.user) {
    const admin = createAdminClient()
    const { error: orgInsertError } = await admin
      .from('organisations')
      .insert({
        id: data.user.id,
        name: fullName,
        is_approved: false,
        is_otp_verified: false,
      })

    if (orgInsertError) {
      console.error('Failed to create organisation record:', orgInsertError)
    }
  }

  revalidatePath('/', 'layout')
  redirect(`/check-email?email=${encodeURIComponent(email)}`)
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function verifyOrgOtpAction(otpCode: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to verify.' }
  }

  const admin = createAdminClient()
  const { data: orgData, error: orgError } = await admin
    .from('organisations')
    .select('org_otp')
    .eq('id', user.id)
    .single()

  if (orgError || !orgData) {
    return { error: 'Organisation record not found.' }
  }

  const storedOtp = orgData.org_otp || ''
  const isMatch =
    storedOtp.length > 0 &&
    otpCode.length > 0 &&
    storedOtp.length === otpCode.length &&
    crypto.timingSafeEqual(Buffer.from(storedOtp), Buffer.from(otpCode))

  if (!isMatch) {
    return { error: 'Invalid code. Please try again.' }
  }

  const { error: updateError } = await admin
    .from('organisations')
    .update({
      is_otp_verified: true,
      org_otp: null,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Failed to update verification status.' }
  }

  revalidatePath('/', 'layout')
  redirect('/pending-approval')
}
