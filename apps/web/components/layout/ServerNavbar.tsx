import { getAuthContext } from "@/lib/auth/server";
import { api } from "@/lib/api";
import Navbar from "./Navbar";

export default async function ServerNavbar() {
  const { user, role } = await getAuthContext();
  let qrCode = null;

  if (user) {
    try {
      const { profile } = await api.profile.get();
      if (profile?.cklId) {
        qrCode = profile.cklId;
      }
    } catch {}
  }

  const serializedUser = user ? JSON.parse(JSON.stringify(user)) : null;

  return <Navbar initialUser={serializedUser} initialRole={role || "user"} initialQrCode={qrCode} />;
}
