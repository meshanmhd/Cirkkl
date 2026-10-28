import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirect to events page as the default dashboard view
  // This is a simple page-level redirect and won't conflict with middleware
  // since middleware only redirects TO /dashboard/events, never FROM /dashboard
  redirect("/dashboard/events");
}
