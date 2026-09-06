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
import { DotQRCode } from "@/components/ui/DotQRCode";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Ticket, ChevronLeft } from "lucide-react";

interface EventRegistration {
  ticket_code: string;
  event_id: string;
  event_title: string;
}

export function ProfileMenu({ initialUser = null, initialRole = "user", initialQrCode = null }: { initialUser?: any, initialRole?: string, initialQrCode?: string | null }) {
  const [user, setUser] = useState<any>(initialUser);
  const [role, setRole] = useState<string>(initialRole);
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode);
  const [loading, setLoading] = useState(false);
  
  // Dialog state
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<EventRegistration | null>(null);
  
  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventsView, setEventsView] = useState(false);
  
  const [myEvents, setMyEvents] = useState<EventRegistration[]>([]);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("role, qr_code")
        .eq("id", userId)
        .single();
      if (profile) {
        setRole(profile.role);
        setQrCode(profile.qr_code);
      }
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  };

  const fetchMyEvents = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("registrations")
        .select("ticket_code, event_id, events(title)")
        .eq("user_id", userId);
      if (data) {
        setMyEvents(
          data.map((r: any) => ({
            ticket_code: r.ticket_code,
            event_id: r.event_id,
            event_title: r.events?.title ?? "Untitled Event",
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted && session?.user) {
          setUser(session.user);
          await Promise.all([fetchRole(session.user.id), fetchMyEvents(session.user.id)]);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await Promise.all([fetchRole(session.user.id), fetchMyEvents(session.user.id)]);
        } else {
          setUser(null);
          setRole("user");
          setMyEvents([]);
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
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U";
  };

  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <>
      <div className="relative shrink-0">
        <DropdownMenu 
          open={menuOpen} 
          onOpenChange={(open) => {
            setMenuOpen(open);
            // Reset to profile view when closing
            if (!open) {
              setTimeout(() => setEventsView(false), 200);
            }
          }}
        >
          <DropdownMenuTrigger className="rounded-full shrink-0 overflow-hidden outline-none ring-2 ring-transparent focus-visible:ring-[#cfe467] transition-all">
            <Avatar className="h-9 w-9 border border-[#E5E5EA]">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} alt={fullName} />
              <AvatarFallback className="bg-[#F5F5F7] text-[#111111] font-medium text-xs">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-xl border-[#E5E5EA] shadow-xl p-2 bg-white transition-all duration-200">
            {!eventsView ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal px-2 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-[#111111]">{fullName}</p>
                      <p className="text-xs leading-none text-[#6E6E73] truncate">{user.email}</p>
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
                
                {/* 
                  Base UI uses closeOnClick={false} to keep the menu open.
                  Also, Base UI uses onClick, NOT onSelect.
                */}
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] flex items-center justify-between"
                  closeOnClick={false}
                  onClick={(e) => {
                    e.preventDefault();
                    setEventsView(true);
                  }}
                >
                  <span>My Events</span>
                  <ChevronRight size={14} className="text-[#6E6E73]" />
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7]">
                  Settings
                </DropdownMenuItem>
                
                {["host", "admin", "superadmin"].includes(role) && (
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
              </>
            ) : (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEventsView(false);
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors shrink-0 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <p className="text-sm font-semibold text-[#111111]">My Events</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-[#E5E5EA] my-1" />
                {myEvents.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-[#6E6E73] text-center">No events registered</p>
                ) : (
                  myEvents.map((reg) => (
                    <DropdownMenuItem
                      key={reg.event_id}
                      className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] flex items-center gap-2"
                      onClick={() => {
                        setSelectedTicket(reg);
                      }}
                    >
                      <Ticket size={14} className="text-[#6E6E73] shrink-0" />
                      <span className="truncate">{reg.event_title}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile QR Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent
          className="sm:max-w-sm rounded-[32px] p-0 bg-white border border-[#E5E5EA] overflow-hidden [&>button]:right-6 [&>button]:top-6 [&>button]:text-[#6E6E73] hover:[&>button]:text-[#111111]"
          style={{
            maskImage: "radial-gradient(circle at left calc(100% - 340px), transparent 16px, black 17px, black 100%), radial-gradient(circle at right calc(100% - 340px), transparent 16px, black 17px, black 100%)",
            maskSize: "51% 100%",
            maskPosition: "left, right",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(circle at left calc(100% - 340px), transparent 16px, black 17px, black 100%), radial-gradient(circle at right calc(100% - 340px), transparent 16px, black 17px, black 100%)",
            WebkitMaskSize: "51% 100%",
            WebkitMaskPosition: "left, right",
            WebkitMaskRepeat: "no-repeat",
          }}
        >
          <div className="relative flex flex-col items-center p-8 bg-gradient-to-b from-[#F5F5F7]/80 to-white">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#cfe467]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-6 right-6 top-[calc(100%-340px)] border-t-[2px] border-dotted border-[#E5E5EA] z-0" />
            <DialogHeader className="w-full relative z-10 mb-8 mt-2">
              <DialogTitle className="text-center text-sm font-bold text-[#6E6E73] uppercase tracking-[0.2em]">Digital Pass</DialogTitle>
            </DialogHeader>
            {qrCode ? (
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="flex flex-col items-center mb-8">
                  <Avatar className="h-20 w-20 border-[3px] border-white shadow-sm mb-4 ring-1 ring-[#E5E5EA]">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} alt={fullName} />
                    <AvatarFallback className="bg-[#cfe467] text-[#111111] font-bold text-xl">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-bold text-[#111111] tracking-tight text-center">{fullName}</h3>
                  <p className="text-sm font-medium text-[#6E6E73] capitalize mt-1">
                    {role === "user" ? "Member" : role}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-[28px] border border-[#E5E5EA] w-full max-w-[220px] aspect-square flex items-center justify-center relative">
                  <DotQRCode value={qrCode.toUpperCase()} size={180} />
                </div>
                <div className="mt-5 flex flex-col items-center">
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

      {/* Event Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <DialogContent
          className="sm:max-w-sm rounded-[32px] p-0 bg-white border border-[#E5E5EA] overflow-hidden [&>button]:right-6 [&>button]:top-6 [&>button]:text-[#6E6E73] hover:[&>button]:text-[#111111]"
          style={{
            maskImage: "radial-gradient(circle at left calc(100% - 260px), transparent 16px, black 17px, black 100%), radial-gradient(circle at right calc(100% - 260px), transparent 16px, black 17px, black 100%)",
            maskSize: "51% 100%",
            maskPosition: "left, right",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(circle at left calc(100% - 260px), transparent 16px, black 17px, black 100%), radial-gradient(circle at right calc(100% - 260px), transparent 16px, black 17px, black 100%)",
            WebkitMaskSize: "51% 100%",
            WebkitMaskPosition: "left, right",
            WebkitMaskRepeat: "no-repeat",
          }}
        >
          <div className="relative flex flex-col items-center p-8 bg-gradient-to-b from-[#F5F5F7]/80 to-white">
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#cfe467]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-6 right-6 top-[calc(100%-260px)] border-t-[2px] border-dotted border-[#E5E5EA] z-0" />
            <DialogHeader className="w-full relative z-10 mb-8 mt-2">
              <DialogTitle className="text-center text-sm font-bold text-[#6E6E73] uppercase tracking-[0.2em]">Event Ticket</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="bg-white p-5 rounded-[28px] border border-[#E5E5EA] w-full max-w-[220px] aspect-square flex items-center justify-center relative">
                  <DotQRCode value={selectedTicket.ticket_code.toUpperCase()} size={180} />
                </div>
                <div className="mt-6 flex flex-col items-center gap-1">
                  <h3 className="text-lg font-bold text-[#111111] tracking-tight text-center leading-snug">
                    {selectedTicket.event_title}
                  </h3>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
