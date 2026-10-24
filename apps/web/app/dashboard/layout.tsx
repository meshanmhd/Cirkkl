import { requireOrg } from "@/lib/auth/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireOrg();

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
