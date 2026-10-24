import { redirect } from "next/navigation"
import { getAuthContext } from "@/lib/auth/server"
import { PendingApprovalClient } from "@/components/auth/PendingApprovalClient"

export default async function PendingApprovalPage() {
  const { user, org } = await getAuthContext()

  if (!user) {
    redirect("/login")
  }

  if (!org) {
    redirect("/")
  }

  if (!org.is_otp_verified) {
    redirect("/verify-org")
  }

  if (org.is_approved) {
    redirect("/dashboard/events")
  }

  return <PendingApprovalClient />
}
