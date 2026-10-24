import { signOutAction } from "@/app/actions/auth";

export async function signOut() {
  return signOutAction();
}
