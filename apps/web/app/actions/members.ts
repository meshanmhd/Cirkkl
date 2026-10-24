"use server";

import { requireOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/utils/supabase/admin";

const VALID_ROLES = ["ceo", "lead", "co-lead", "member"];

export async function updateMemberRole(memberId: string, newRole: string) {
  const normalizedRole = newRole.toLowerCase();

  if (!VALID_ROLES.includes(normalizedRole)) {
    return { error: `Invalid role: ${newRole}` };
  }

  const { org } = await requireOrg();

  const { error, data } = await createAdminClient()
    .from("members")
    .update({ role: normalizedRole })
    .eq("id", memberId)
    .eq("org_id", org.id)
    .select();

  if (error) {
    console.error("[updateMemberRole] DB error:", JSON.stringify(error));
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    console.error("[updateMemberRole] No rows matched — memberId:", memberId, "org_id:", org.id);
    return { error: "Member not found or not in your organisation." };
  }

  console.log("[updateMemberRole] Updated:", data);
  return { success: true };
}
