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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ProfileMenu({ initialUser = null, initialRole = "user", initialQrCode = null }: { initialUser?: any, initialRole?: string, initialQrCode?: string | null }) {
  const [user, setUser] = useState<any>(initialUser);
  const [role, setRole] = useState<string>(initialRole);
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode);
  const [loading, setLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchRole = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role, qr_code')
          .eq('id', userId)
          .single();
        if (mounted && profile) {
          setRole(profile.role);
          setQrCode(profile.qr_code);
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
    <>
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
        <DropdownMenuItem 
          className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]"
          onClick={() => setQrOpen(true)}
        >
          My QR
        </DropdownMenuItem>
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

    <Dialog open={qrOpen} onOpenChange={setQrOpen}>
      <DialogContent className="sm:max-w-sm rounded-[32px] p-0 bg-white border border-[#E5E5EA] overflow-hidden shadow-2xl [&>button]:right-6 [&>button]:top-6 [&>button]:text-[#6E6E73] hover:[&>button]:text-[#111111]">
        <div className="relative flex flex-col items-center p-8 bg-gradient-to-b from-[#F5F5F7]/80 to-white min-h-[500px]">
          {/* Decorative blur */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#cfe467]/20 rounded-full blur-3xl pointer-events-none" />
          
          <DialogHeader className="w-full relative z-10 mb-8 mt-2">
            <DialogTitle className="text-center text-sm font-bold text-[#6E6E73] uppercase tracking-[0.2em]">Digital Pass</DialogTitle>
          </DialogHeader>

          {qrCode ? (
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* User Info */}
              <div className="flex flex-col items-center mb-8">
                <Avatar className="h-20 w-20 border-[3px] border-white shadow-sm mb-4 ring-1 ring-[#E5E5EA]">
                  <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} alt={fullName} />
                  <AvatarFallback className="bg-[#cfe467] text-[#111111] font-bold text-xl">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold text-[#111111] tracking-tight text-center">{fullName}</h3>
                <p className="text-sm font-medium text-[#6E6E73] capitalize mt-1">
                  {role === 'user' ? 'Member' : role}
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-5 rounded-[28px] border border-[#E5E5EA] w-full max-w-[220px] aspect-square flex items-center justify-center relative">
                <QRCode 
                  value={qrCode.toUpperCase()} 
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  fgColor="#111111"
                  bgColor="#ffffff"
                  level="Q"
                />
              </div>

              {/* ID Number */}
              <div className="mt-3 flex flex-col items-center">
                <p className="text-[13px] font-semibold text-[#6E6E73] mb-2 tracking-wide">Cirkkl ID</p>
                <div className="bg-[#F5F5F7] rounded-2xl px-6 py-2.5 border border-[#E5E5EA]/60">
                  <p className="text-xl font-mono font-bold text-[#111111] tracking-[0.15em]">{qrCode.toUpperCase()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[200px] h-[200px] bg-[#F5F5F7] rounded-2xl flex items-center justify-center border-2 border-dashed border-[#E5E5EA] mt-12">
              <p className="text-sm text-[#6E6E73] font-medium px-4 text-center">No QR code found for this profile.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
