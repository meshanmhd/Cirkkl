import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth/server'
import { VerifyOrgClient } from '@/components/auth/VerifyOrgClient'

export default async function VerifyOrgPage() {
  const { user, org } = await getAuthContext()

  if (!user) {
    redirect('/login')
  }

  if (!org) {
    redirect('/')
  }

  if (org.is_otp_verified) {
    if (org.is_approved) {
      redirect('/dashboard/events')
    }
    redirect('/pending-approval')
  }

  return <VerifyOrgClient email={user.email || ''} />
}
