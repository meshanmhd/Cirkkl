"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Loader2, Check, X, Users, Search, ChevronDown, MoreHorizontal, 
  AlertCircle, Ticket, Trash2, Calendar, Bell
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

type Notification = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  sender_id: string;
  event_id: string;
  team_id: string;
  sender: { full_name: string };
  event: { title: string };
  team: { name: string };
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"all" | "invites" | "general">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, type, read, created_at, sender_id, event_id, team_id,
        event:events!event_id(title),
        team:teams!team_id(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      // Fetch sender details separately since there's no FK constraint for the join
      const senderIds = Array.from(new Set(data.map((n: any) => n.sender_id).filter(Boolean)));
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', senderIds);
        
      const userMap = new Map(usersData?.map((u: any) => [u.id, u.full_name]) || []);
      
      const enrichedData = data.map((n: any) => ({
        ...n,
        sender: { full_name: userMap.get(n.sender_id) || 'Someone' }
      }));
      
      setNotifications(enrichedData as unknown as Notification[]);
    } else if (error) {
      console.error('[Notifications] fetch error:', error);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markSingleAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAccept = async (notif: Notification) => {
    setProcessingId(notif.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error: tmError } = await supabase
        .from('team_members')
        .update({ status: 'approved' })
        .eq('team_id', notif.team_id)
        .eq('user_id', user.id);

      if (tmError) throw tmError;

      await markSingleAsRead(notif.id);
      alert("You have joined the team! The team leader's registration covers your spot.");
    } catch (err: any) {
      alert("Failed to accept invite: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (notif: Notification) => {
    setProcessingId(notif.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('team_members').delete().eq('team_id', notif.team_id).eq('user_id', user.id);
      await deleteNotif(notif.id);
    } catch (err: any) {
      alert("Failed to decline invite: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getTitleDesc = (n: Notification) => {
    if (n.type === 'team_invite') {
      return {
        title: `Team Invite: ${n.team?.name}`,
        desc: `${n.sender?.full_name || 'Someone'} invited you to join for ${n.event?.title}.`
      };
    }
    if (n.type === 'registration_approved') {
      return {
        title: `Registration Approved`,
        desc: `Your registration for ${n.event?.title} has been approved.`
      };
    }
    return {
      title: `Notification`,
      desc: `You have a new update for ${n.event?.title || 'an event'}.`
    };
  };

  const getBadgeInfo = (type: string) => {
    switch(type) {
      case 'team_invite':
        return { icon: Users, text: "Team Invite", color: "text-[#111111]" };
      case 'registration_approved':
        return { icon: Ticket, text: "Registration", color: "text-[#111111]" };
      case 'event_update':
        return { icon: Calendar, text: "Event Update", color: "text-[#111111]" };
      default:
        return { icon: AlertCircle, text: "System", color: "text-[#111111]" };
    }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === "invites" && n.type !== 'team_invite') return false;
    if (activeTab === "general" && n.type === 'team_invite') return false;
    if (searchQuery) {
       const search = searchQuery.toLowerCase();
       const { title, desc } = getTitleDesc(n);
       if (!title.toLowerCase().includes(search) && !desc.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white font-geist">
      <Navbar />
      <div className="pt-28 pb-20 px-[10%] w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[22px] font-bold text-[#111111] tracking-tight">Notifications</h1>
        </div>

        <div className="flex items-center gap-6 border-b border-[#E5E5EA] mb-6">
          {["All", "Invites", "General"].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab.toLowerCase() ? "text-[#111111]" : "text-[#6E6E73] hover:text-[#111111]"}`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#cfe467] rounded-t-md" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-[320px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7]" />
            <input 
              type="text" 
              placeholder="Search for notification" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E5EA] rounded-lg text-sm text-[#111111] placeholder:text-[#9E9EA7] focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllAsRead} className="px-4 py-2 bg-white border border-[#E5E5EA] rounded-lg text-[13px] font-medium text-[#111111] hover:bg-[#cfe467]/20 hover:border-[#cfe467] hover:text-[#111111] transition-all whitespace-nowrap">
              Mark all as read
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#cfe467]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Image src="/noNotification.png" alt="No notifications" width={240} height={240} className="mb-4 opacity-90" />
            <h2 className="text-lg font-bold text-[#111111]">No notifications here</h2>
            <p className="text-[14px] text-[#6E6E73] mt-2 max-w-sm leading-relaxed">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="flex flex-col border-t border-[#E5E5EA]">
            {filtered.map(notif => {
              const { title, desc } = getTitleDesc(notif);
              const badge = getBadgeInfo(notif.type);
              const Icon = badge.icon;
              return (
                <div 
                  key={notif.id} 
                  onClick={() => { if (!notif.read) markSingleAsRead(notif.id); }}
                  className={`flex items-center justify-between py-4 border-b border-[#E5E5EA] group -mx-4 px-4 transition-colors rounded-xl cursor-pointer ${
                    !notif.read ? 'bg-[#cfe467]/10 hover:bg-[#cfe467]/20' : 'hover:bg-[#F9F9F9]'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0 pr-4">
                    <div className="mt-1.5 shrink-0 flex items-center justify-center w-2">
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-[#cfe467]" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#111111] truncate">{title}</p>
                      <p className="text-sm text-[#6E6E73] truncate mt-0.5">{desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-end shrink-0">
                    <div className="hidden md:flex items-center gap-1.5 shrink-0 w-32">
                      <Icon size={14} className={badge.color} />
                      <span className={`text-[13px] font-semibold ${badge.color}`}>{badge.text}</span>
                    </div>
                    
                    <span className="text-[13px] text-[#6E6E73] w-24 text-right shrink-0">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1.5 rounded-md text-[#9E9EA7] hover:text-[#111111] hover:bg-[#E5E5EA] transition-colors focus:outline-none">
                        <MoreHorizontal size={18} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-[#E5E5EA] p-1">
                        {notif.type === 'team_invite' && !notif.read && (
                          <>
                            <DropdownMenuItem onClick={() => handleAccept(notif)} disabled={processingId === notif.id} className="font-medium text-[#111111] cursor-pointer rounded-lg hover:bg-[#F5F5F7] p-2">
                              {processingId === notif.id ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Check size={14} className="mr-2" />} 
                              Accept Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDecline(notif)} disabled={processingId === notif.id} className="text-red-600 cursor-pointer rounded-lg hover:bg-red-50 p-2">
                              {processingId === notif.id ? <Loader2 size={14} className="mr-2 animate-spin" /> : <X size={14} className="mr-2" />} 
                              Decline
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#E5E5EA]" />
                          </>
                        )}
                        {!notif.read && (
                          <DropdownMenuItem onClick={() => markSingleAsRead(notif.id)} className="cursor-pointer rounded-lg hover:bg-[#F5F5F7] p-2 text-sm">
                            <Check size={14} className="mr-2 text-[#6E6E73]" /> Mark as read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteNotif(notif.id)} className="text-red-600 cursor-pointer rounded-lg hover:bg-red-50 p-2 text-sm">
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
