"use client";

import { useState, useMemo } from "react";
import { updateMemberRole } from "@/app/actions/members";
import { Search, MoreHorizontal, UserCheck, Shield, Users, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MemberRow = {
  id: string;
  ckl_id?: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
  joined_at: string | null;
  department: string | null;
};

const ROLE_TABS = ["All Members", "Lead", "Co-Lead", "Member"] as const;
type RoleTab = (typeof ROLE_TABS)[number];

function getRoleConfig(role: string | null) {
  switch (role?.toLowerCase()) {
    case "lead":
      return {
        label: "Lead",
        bg: "#F0FFF4",
        color: "#34C759",
        icon: Crown,
      };
    case "co-lead":
      return {
        label: "Co-Lead",
        bg: "#EBF5FF",
        color: "#007AFF",
        icon: Shield,
      };
    default:
      return {
        label: "Member",
        bg: "#F5F5F7",
        color: "#6E6E73",
        icon: Users,
      };
  }
}

function getInitials(name: string | null) {
  if (!name) return "M";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface MembersTableProps {
  members: MemberRow[];
}

const DEPARTMENTS = [
  "All Departments",
  "AI & DS",
  "CE",
  "CSE",
  "CSE (CS)",
  "EEE",
  "ECE",
  "ME",
  "FT",
  "AE",
  "BME",
];

const ROLES = ["All Roles", "CEO", "Lead", "Co-Lead", "Member"];

export function MembersTable({ members: initialMembers }: MembersTableProps) {
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All Departments");
  const [activeRole, setActiveRole] = useState("All Roles");

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !search ||
        (m.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (m.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (m.department?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesDept =
        activeDepartment === "All Departments" || m.department === activeDepartment;

      const matchesRole =
        activeRole === "All Roles" || (m.role?.toLowerCase() === activeRole.toLowerCase());

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [members, search, activeDepartment, activeRole]);

  return (
    <div className="bg-white rounded-[16px] border border-[#E5E5EA] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA] gap-4 flex-wrap">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7] pointer-events-none"
            style={{ width: "14px", height: "14px" }}
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[14px] text-[#111111] placeholder:text-[#9E9EA7] outline-none focus:border-[#cfe467] focus:ring-1 focus:ring-[#cfe467] transition-all duration-200 w-[280px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all duration-200 outline-none">
              {activeDepartment}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#6E6E73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E5E5EA] p-1 bg-white">
              {DEPARTMENTS.map((dept) => (
                <DropdownMenuItem
                  key={dept}
                  onClick={() => setActiveDepartment(dept)}
                  className={`cursor-pointer rounded-[8px] px-3 py-2 text-[13px] transition-colors ${activeDepartment === dept
                      ? "bg-[#F5F5F7] font-semibold text-[#111111]"
                      : "text-[#6E6E73] hover:bg-[#FAFAFA] hover:text-[#111111]"
                    }`}
                >
                  {dept}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all duration-200 outline-none">
              {activeRole}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#6E6E73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl border-[#E5E5EA] p-1 bg-white">
              {ROLES.map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`cursor-pointer rounded-[8px] px-3 py-2 text-[13px] transition-colors ${activeRole === role
                      ? "bg-[#F5F5F7] font-semibold text-[#111111]"
                      : "text-[#6E6E73] hover:bg-[#FAFAFA] hover:text-[#111111]"
                    }`}
                >
                  {role}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E5EA]">
              {["MEMBER", "ROLE", "DEPARTMENT", "CKL ID", "JOINED ON"].map((col) => (
                <th
                  key={col}
                  className={`px-6 py-4 text-[12px] font-medium text-[#9E9EA7] tracking-[0.05em] uppercase whitespace-nowrap ${
                    col === "MEMBER" ? "text-left" : "text-center"
                  }`}
                >
                  {col}
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                      <UserCheck className="text-[#9E9EA7]" size={24} strokeWidth={1.5} />
                    </div>
                    <p className="text-[14px] font-semibold text-[#111111]">No members found</p>
                    <p className="text-[13px] text-[#6E6E73]">
                      {search
                        ? "Try a different search term."
                        : "Invite members to get started."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((member, idx) => {
                const roleConfig = getRoleConfig(member.role);
                const RoleIcon = roleConfig.icon;
                const isEditing = editingRowId === member.id;
                
                return (
                  <tr
                    key={member.id}
                    className={`border-b border-[#F5F5F7] hover:bg-[#FAFAFA] transition-colors duration-150 ${idx === filtered.length - 1 ? "border-b-0" : ""
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-[#E5E5EA] shrink-0">
                          <AvatarImage
                            src={
                              member.avatar_url ||
                              `https://api.dicebear.com/7.x/notionists/svg?seed=${member.id}`
                            }
                            alt={member.full_name || ""}
                          />
                          <AvatarFallback className="bg-[#F5F5F7] text-[#111111] font-medium text-xs">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[13px] text-[#111111] truncate">
                            {member.full_name || "-"}
                          </p>
                          <p className="text-[12px] text-[#6E6E73] truncate mt-0.5">{member.email || "-"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {isEditing ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-between gap-2 min-w-[110px] border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#111111] bg-white outline-none focus:border-[#cfe467] capitalize">
                            <span className="flex-1 text-left truncate">{editingRole}</span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 shrink-0">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-[110px] rounded-xl border-[#E5E5EA] p-1 bg-white">
                            {ROLES.filter(r => r !== "All Roles").map(r => (
                              <DropdownMenuItem
                                key={r}
                                onClick={() => setEditingRole(r.toLowerCase())}
                                className="cursor-pointer rounded-[8px] px-3 py-2 text-[13px] text-[#111111] hover:bg-[#F5F5F7]"
                              >
                                {r}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-[13px] text-[#111111] capitalize">
                          {member.role || "Member"}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] text-[#111111]">
                        {member.department || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] text-[#111111]">
                        {member.ckl_id || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] text-[#111111]">
                        {formatDate(member.joined_at)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          {saveError && editingRowId === member.id && (
                            <span className="text-[11px] text-red-500 mr-1">{saveError}</span>
                          )}
                          <button
                            onClick={() => {
                              setEditingRowId(null);
                              setSaveError(null);
                            }}
                            className="text-[#6E6E73] text-[13px] font-medium hover:text-[#111111] px-2 py-1"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={saving}
                            onClick={async () => {
                              const normalizedRole = editingRole.toLowerCase();
                              setSaving(true);
                              setSaveError(null);

                              const result = await updateMemberRole(member.id, normalizedRole);

                              setSaving(false);

                              if (!result.error) {
                                setMembers(prev =>
                                  prev.map(m =>
                                    m.id === member.id ? { ...m, role: normalizedRole } : m
                                  )
                                );
                                setEditingRowId(null);
                              } else {
                                console.error("Failed to update role:", result.error);
                                setSaveError(result.error);
                              }
                            }}
                            className="bg-[#cfe467] text-[#111111] px-3 py-1.5 rounded-[8px] text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {saving ? (
                              <>
                                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Saving
                              </>
                            ) : "Save"}
                          </button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#9E9EA7] hover:text-[#111111] hover:bg-[#F5F5F7] transition-all duration-200 outline-none">
                            <MoreHorizontal style={{ width: "16px", height: "16px" }} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl border-[#E5E5EA] p-2 bg-white">
                            <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingRowId(member.id);
                                setEditingRole(member.role || "member");
                              }}
                              className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]"
                            >
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#E5E5EA] my-1" />
                            <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600">
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-[#E5E5EA] flex items-center justify-between">
          <p className="text-[12px] text-[#9E9EA7]">
            Showing <span className="font-semibold text-[#6E6E73]">{filtered.length}</span> of{" "}
            <span className="font-semibold text-[#6E6E73]">{members.length}</span> members
          </p>
        </div>
      )}

    </div>
  );
}
