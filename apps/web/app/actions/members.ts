"use server";

import { api } from "@/lib/api";

const VALID_ROLES = ["ceo", "lead", "co-lead", "member"];

export async function updateMemberRole(memberId: string, newRole: string) {
  const normalizedRole = newRole.toLowerCase();

  if (!VALID_ROLES.includes(normalizedRole)) {
    return { error: `Invalid role: ${newRole}` };
  }

  try {
    await api.org.updateMemberRole(memberId, normalizedRole);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update member role" };
  }
}
