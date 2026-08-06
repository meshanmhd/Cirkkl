'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signupAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('name') as string
  const role = formData.get('role') as string || 'user'
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      }
    }
  })

  if (error) {
    return { error: error.message }
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
  
  // Get the logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to verify." }
  }

  // Fetch the custom OTP from the organisations table
  const { data: orgData, error: orgError } = await supabase
    .from('organisations')
    .select('org_otp')
    .eq('id', user.id)
    .single()

  if (orgError || !orgData) {
    return { error: "Organisation record not found." }
  }

  // Check if the OTP matches
  if (orgData.org_otp !== otpCode) {
    return { error: "Invalid code. Please try again." }
  }

  // Success! Update user metadata to mark OTP as verified
  const { error: updateError } = await supabase.auth.updateUser({
    data: { is_otp_verified: true }
  })
  
  if (updateError) {
    return { error: "Failed to update verification status." }
  }
  
  // Optionally clear the OTP from the database so it can't be reused
  await supabase
    .from('organisations')
    .update({ org_otp: null })
    .eq('id', user.id)

  revalidatePath('/', 'layout')
  redirect('/pending-approval')
}
