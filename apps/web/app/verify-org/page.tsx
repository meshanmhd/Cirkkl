import { getAuthContext } from '@/lib/auth/server'
import { VerifyOrgClient } from '@/components/auth/VerifyOrgClient'

export default async function VerifyOrgPage() {
  const { user, org } = await getAuthContext()

  // Middleware handles all redirects to avoid cascading navigation attempts
  // If we reached this page, middleware validated everything
  // Just render the component - middleware ensures we have the right state

  return <VerifyOrgClient email={user?.email || ''} />
}
