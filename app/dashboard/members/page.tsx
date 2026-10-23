import { requireOrg } from "@/lib/auth/server";
import { createClient } from "@/utils/supabase/server";
import { Users } from "lucide-react";
import { MembersTable } from "@/components/dashboard/MembersTable";

export default async function MembersPage() {
  const { org } = await requireOrg();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("members")
    .select("id, ckl_id, full_name, avatar_url, email, role, joined_at, department")
    .eq("org_id", org.id)
    .order("joined_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-semibold text-[#111111] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #cfe467 0%, #c0d955 100%)" }}
        >
          <Users style={{ width: "16px", height: "16px" }} strokeWidth={2.5} />
          Invite Member
        </button>
      </div>

      <MembersTable members={members ?? []} />
    </div>
  );
}
