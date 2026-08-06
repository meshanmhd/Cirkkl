"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "C"
  );
}

interface DashboardTopBarProps {
  user: User;
}

export function DashboardTopBar({ user }: DashboardTopBarProps) {
  const router = useRouter();
  const supabase = createClient();

  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Club Admin";
  const initials = getInitials(fullName);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-end px-6 md:px-8 border-b border-[#E5E5EA] bg-white"
      style={{ height: "56px" }}
    >

      <div className="flex items-center gap-2.5">
        <button className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7] transition-all duration-200">
          <Bell style={{ width: "18px", height: "18px" }} strokeWidth={1.8} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "#cfe467" }} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none ring-2 ring-transparent focus-visible:ring-[#cfe467] transition-all">
            <Avatar className="h-9 w-9 border border-[#E5E5EA]">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} alt={fullName} />
              <AvatarFallback className="bg-[#F5F5F7] text-[#111111] font-medium text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#E5E5EA] p-2 bg-white mt-1">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-[#111111]">{fullName}</p>
              <p className="text-xs text-[#6E6E73] truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-[#E5E5EA] my-1" />
            <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E5E5EA] my-1" />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
              onClick={handleSignOut}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
