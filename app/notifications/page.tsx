"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Loader2, Check, X, Users, Search, ChevronDown, MoreHorizontal, 
  AlertCircle, Ticket, Trash2, Calendar, Bell, RefreshCw
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import { acceptTeamInvite } from "@/app/actions/registration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

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
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successDialogMessage, setSuccessDialogMessage] = useState("");
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [inviteToAccept, setInviteToAccept] = useState<Notification | null>(null);
  const [inviteToReject, setInviteToReject] = useState<Notification | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await supabase.from('notifications')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', thirtyDaysAgo.toISOString());

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, type, read, created_at, sender_id, event_id, team_id,
        event:events(title),
        team:teams(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const senderIds = Array.from(new Set(data.map((n: any) => n.sender_id).filter(Boolean)));
      let userMap = new Map();
      if (senderIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', senderIds);
        userMap = new Map(usersData?.map((u: any) => [u.id, u.full_name]) || []);
      }
      
      const teamIds = Array.from(new Set(data.map((n: any) => n.team_id).filter(Boolean)));
      let teamStatusMap = new Map();
      if (teamIds.length > 0) {
        const { data: teamMembersData } = await supabase
          .from('team_members')
          .select('team_id, status')
          .eq('user_id', user.id)
          .in('team_id', teamIds);
        teamStatusMap = new Map(teamMembersData?.map((tm: any) => [tm.team_id, tm.status]) || []);
      }
      
      const enrichedData = data.map((n: any) => {
        let isRead = n.read;
        let finalStatus = null;
        if (n.type === 'team_invite') {
          const status = teamStatusMap.get(n.team_id);
          finalStatus = status;
          if (status === 'pending') {
            isRead = false;
          } else if (status === 'approved' || status === 'rejected') {
            isRead = true;
          }
        }
        return {
          ...n,
          read: isRead,
          team_status: finalStatus,
          sender: { full_name: userMap.get(n.sender_id) || 'Someone' }
        };
      });
      
      setNotifications(enrichedData as unknown as Notification[]);
    } else if (error) {
      console.error('[Notifications] fetch error:', error);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .neq('type', 'team_invite');
      
    setNotifications(prev => prev.map(n => 
      (n.type === 'team_invite' && !n.read) ? n : { ...n, read: true }
    ));
  };

  const markSingleAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const confirmAccept = async () => {
    if (!inviteToAccept) return;
    const notif = inviteToAccept;
    setProcessingId(notif.id);
    try {
      const result = await acceptTeamInvite(notif.team_id, notif.event_id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      await markSingleAsRead(notif.id);
      setSuccessDialogMessage(`You have joined the team ${notif.team?.name}, for any query contact the team leader.`);
      setSuccessDialogOpen(true);
    } catch (err: any) {
      alert("Failed to accept invite: " + err.message);
    } finally {
      setProcessingId(null);
      setInviteToAccept(null);
    }
  };

  const confirmDecline = async () => {
    if (!inviteToReject) return;
    const notif = inviteToReject;
    setProcessingId(notif.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('team_members').update({ status: 'rejected' }).eq('team_id', notif.team_id).eq('user_id', user.id);
      await markSingleAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, team_status: 'rejected' } : n));
    } catch (err: any) {
      alert("Failed to decline invite: " + err.message);
    } finally {
      setProcessingId(null);
      setInviteToReject(null);
    }
  };

  const getTitleDesc = (n: Notification & { team_status?: string }) => {
    if (n.type === 'team_invite') {
      const teamName = n.team?.name || 'the team';
      if (n.team_status === 'approved') {
        return {
          title: `Team Invite Accepted`,
          desc: `You joined ${teamName} for the event ${n.event?.title}.`
        };
      }
      if (n.team_status === 'rejected') {
        return {
          title: `Team Invite Rejected`,
          desc: `You declined the invite to join ${teamName} for the event ${n.event?.title}.`
        };
      }
      return {
        title: `Team Invite received`,
        desc: `${n.sender?.full_name || 'Someone'} invited you to join ${teamName} for the event ${n.event?.title}.`
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
            <button onClick={fetchNotifications} className="p-2 bg-white border border-[#E5E5EA] rounded-lg text-[#111111] hover:bg-[#F5F5F7] transition-all" title="Refresh">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={markAllAsRead} className="px-4 py-2 bg-white border border-[#E5E5EA] rounded-lg text-[13px] font-medium text-[#111111] hover:bg-[#cfe467]/20 hover:border-[#cfe467] hover:text-[#111111] transition-all whitespace-nowrap">
              Mark all as read
            </button>
          </div>
        </div>

        {notLoggedIn ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-4">
              <Users size={28} className="text-[#9E9EA7]" />
            </div>
            <h2 className="text-lg font-bold text-[#111111]">Login Required</h2>
            <p className="text-[14px] text-[#6E6E73] mt-2 max-w-sm leading-relaxed mb-6">
              You need to be logged in to view your notifications and invites.
            </p>
            <Link href="/login" className="px-6 py-2.5 bg-[#cfe467] hover:bg-[#b8cc58] text-[#111111] text-[13px] font-bold rounded-[10px] transition-colors">
              Log in to continue
            </Link>
          </div>
        ) : loading ? (
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
                  onClick={() => { if (!notif.read && notif.type !== 'team_invite') markSingleAsRead(notif.id); }}
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
                      <span className={`text-[13px] ${badge.color}`}>{badge.text}</span>
                    </div>
                    
                    <span className="text-[13px] text-[#6E6E73] min-w-[120px] text-right shrink-0">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>

                    {notif.type === 'team_invite' && !notif.read && (
                      <div className="hidden sm:flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setInviteToReject(notif); }}
                          disabled={processingId === notif.id}
                          className="px-4 py-1.5 text-[13px] font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-[#E5E5EA] rounded-md transition-colors flex items-center disabled:opacity-50"
                        >
                          <X size={12} className="mr-1.5" />
                          Reject
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setInviteToAccept(notif); }}
                          disabled={processingId === notif.id}
                          className="px-4 py-1.5 text-[13px] font-medium text-[#111111] bg-[#cfe467] hover:bg-[#b8cc58] border border-[#E5E5EA] rounded-md transition-colors flex items-center disabled:opacity-50"
                        >
                          <Check size={12} className="mr-1.5" />
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent className="max-w-sm rounded-[20px] p-6">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-[#cfe467] flex items-center justify-center mx-auto mb-1">
                <Check className="text-[#111111]" size={22} />
              </div>
              <DialogTitle className="text-center text-[16px] font-bold text-[#111111]">Success</DialogTitle>
            </DialogHeader>
            <p className="text-[13px] text-[#6E6E73] text-center mt-1">{successDialogMessage}</p>
            <div className="flex justify-center mt-5">
              <button 
                onClick={() => setSuccessDialogOpen(false)} 
                className="w-full py-2.5 rounded-[10px] bg-[#cfe467] text-[#111111] text-[13px] font-semibold hover:bg-[#b8cc58] transition-all"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!inviteToReject} onOpenChange={(open) => !open && setInviteToReject(null)}>
          <DialogContent showCloseButton={false} className="max-w-sm rounded-[24px] p-6 overflow-hidden shadow-xl border border-[#E5E5EA] bg-white text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-[17px] font-bold text-[#111111]">Reject Invite?</DialogTitle>
              <p className="text-[13px] text-[#6E6E73] mt-2">
                Are you sure you want to reject the invite to join the team <span className="font-semibold text-[#111111]">{inviteToReject?.team?.name}</span>?
              </p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setInviteToReject(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-[10px] text-[13px] font-semibold text-[#111111] hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-[10px] text-[13px] font-semibold hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!inviteToAccept} onOpenChange={(open) => !open && setInviteToAccept(null)}>
          <DialogContent showCloseButton={false} className="max-w-sm rounded-[24px] p-6 overflow-hidden shadow-xl border border-[#E5E5EA] bg-white text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#cfe467]/30 flex items-center justify-center shrink-0">
              <Check size={20} className="text-[#111111]" />
            </div>
            <div>
              <DialogTitle className="text-[17px] font-bold text-[#111111]">Accept Invite?</DialogTitle>
              <p className="text-[13px] text-[#6E6E73] mt-2">
                Are you sure you want to join the team <span className="font-semibold text-[#111111]">{inviteToAccept?.team?.name}</span>?
              </p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setInviteToAccept(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-[10px] text-[13px] font-semibold text-[#111111] hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAccept}
                className="flex-1 px-4 py-2.5 bg-[#cfe467] text-[#111111] rounded-[10px] text-[13px] font-semibold hover:bg-[#b8cc58] transition-colors"
              >
                Accept
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
