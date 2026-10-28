import { api } from "@/lib/api";
import { Users } from "lucide-react";
import { MembersTable } from "@/components/dashboard/MembersTable";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const data = await api.org.listMembers();
  const members = data.items.map((m) => ({
    id: m.id,
    ckl_id: null,
    full_name: m.name,
    avatar_url: m.avatarUrl ?? null,
    email: m.email ?? null,
    role: m.role ?? null,
    joined_at: m.createdAt ?? null,
    department: m.department ?? null,
  }));

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

      <MembersTable members={members} />
    </div>
  );
}
