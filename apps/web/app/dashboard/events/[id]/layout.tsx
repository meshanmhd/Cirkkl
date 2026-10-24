import { requireOrg } from "@/lib/auth/server";

export default async function EventManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrg();

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      {children}
    </div>
  );
}