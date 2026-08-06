"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ProfileMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchRole = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
        if (mounted && profile) {
          setRole(profile.role);
        }
      } catch (error) {
        console.error("Error fetching role:", error);
      }
    };

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted && session?.user) {
          setUser(session.user);
          await fetchRole(session.user.id);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await fetchRole(session.user.id);
        } else {
          setUser(null);
          setRole("user");
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-medium text-[#111111] hover:bg-[#E5E5EA]/60 transition-all duration-200"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-[#111111] transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "#cfe467" }}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || "U";
  };

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full shrink-0 overflow-hidden outline-none ring-2 ring-transparent focus-visible:ring-[#cfe467] transition-all">
        <Avatar className="h-9 w-9 border border-[#E5E5EA]">
          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} alt={fullName} />
          <AvatarFallback className="bg-[#F5F5F7] text-[#111111] font-medium text-xs">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#E5E5EA] shadow-xl p-2 bg-white">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal px-2 py-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold text-[#111111]">{fullName}</p>
              <p className="text-xs leading-none text-[#6E6E73] truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#E5E5EA] my-1" />
        <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
          Settings
        </DropdownMenuItem>
        
        {/* Only show for host, admin, or superadmin */}
        {['host', 'admin', 'superadmin'].includes(role) && (
          <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm font-medium text-[#cfe467] bg-[#111111] focus:bg-[#222222] focus:text-[#cfe467] mt-1">
            Manage Events
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="bg-[#E5E5EA] my-1" />
        <DropdownMenuItem 
          className="cursor-pointer rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
          onClick={handleSignOut}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
