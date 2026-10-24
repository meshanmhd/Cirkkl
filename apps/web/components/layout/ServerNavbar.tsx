import { createClient } from "@/utils/supabase/server";
import Navbar from "./Navbar";

export default async function ServerNavbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = "user";
  let qrCode = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, qr_code")
      .eq("id", user.id)
      .single();
    if (profile) {
      role = profile.role;
      qrCode = profile.qr_code;
    }
  }
  
  const serializedUser = user ? JSON.parse(JSON.stringify(user)) : null;

  return <Navbar initialUser={serializedUser} initialRole={role} initialQrCode={qrCode} />;
}
