import { getAuthContext } from "@/lib/auth/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles authentication - if we reach here, user is authenticated
  // We can't reliably call requireOrg() here due to Next.js cookie timing issues
  // after server action redirects
  const context = await getAuthContext()
  
  // Create user object with org name if available
  const user = context.user || { 
    id: '', 
    email: '',
    user_metadata: { full_name: context.org?.name || 'Organization' }
  }
  
  // If org name exists, use it as display name
  if (context.org?.name && user) {
    user.user_metadata = { 
      ...user.user_metadata,
      full_name: context.org.name 
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7F8]">
      <Sidebar />
      <div className="flex-1 md:pl-60 flex flex-col min-h-screen">
        <DashboardTopBar user={user} />
        <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
