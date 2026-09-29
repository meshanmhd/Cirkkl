import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfilePage } from "@/components/ProfilePage";

export const metadata = {
  title: "My Profile — Cirkkl",
  description: "View and edit your Cirkkl profile.",
};

export default async function ProfileRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/profile");

  const { data: userRow } = await supabase
    .from("users")
    .select("qr_code, full_name, role")
    .eq("id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <ProfilePage
        profile={{
          ...profile,
          id: user.id,
          email: user.email,
          qr_id: userRow?.qr_code ?? null,
          full_name: profile?.full_name ?? userRow?.full_name ?? null,
        }}
      />
    </div>
  );
}
