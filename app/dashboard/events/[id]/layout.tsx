import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function EventManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      {children}
    </div>
  );
}