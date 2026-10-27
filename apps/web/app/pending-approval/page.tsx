import { getAuthContext } from "@/lib/auth/server"
import { PendingApprovalClient } from "@/components/auth/PendingApprovalClient"

export default async function PendingApprovalPage() {
  const { user, org } = await getAuthContext()

  // Middleware handles all redirects to avoid cascading navigation attempts
  // If we reached this page, middleware validated everything
  // Just render the component - middleware ensures we have the right state

  return <PendingApprovalClient />
}
