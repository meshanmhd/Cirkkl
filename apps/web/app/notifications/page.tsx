"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { 
  Loader2, Check, X, Users, Search, 
  AlertCircle, Ticket, Trash2, Calendar, RefreshCw
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import { api, NotificationItem, getErrorMessage } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"all" | "invites" | "general">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successDialogMessage, setSuccessDialogMessage] = useState("");
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [inviteToAccept, setInviteToAccept] = useState<NotificationItem | null>(null);
  const [inviteToReject, setInviteToReject] = useState<NotificationItem | null>(null);

  const loadNotifications = async () => {
    if (!user) {
      if (!authLoading) {
        setNotLoggedIn(true);
        setLoading(false);
      }
      return;
    }

    try {
      const res = await api.notifications.list({ filter: "all" });
      setNotifications(res.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    if (user) {
      setNotLoggedIn(false);
      api.notifications
        .list({ filter: "all" })
        .then((res) => {
          if (mounted) setNotifications(res.items);
        })
        .catch(console.error)
        .finally(() => {
          if (mounted) setLoading(false);
        });

      unsubscribe = api.notifications.stream(() => {
        if (mounted) {
          api.notifications
            .list({ filter: "all" })
            .then((res) => {
              if (mounted) setNotifications(res.items);
            })
            .catch(console.error);
        }
      });
    } else if (!authLoading) {
      setNotLoggedIn(true);
      setLoading(false);
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [user, authLoading]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadNotifications();
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => 
        (n.type === 'team_invite' && (!n.inviteStatus || n.inviteStatus === 'pending')) ? n : { ...n, isRead: true }
      ));
    } catch (error) {
      console.error(error);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const confirmAccept = async () => {
    if (!inviteToAccept?.teamId || !inviteToAccept.eventId) return;
    const { id, teamId, eventId, teamName, message } = inviteToAccept;
    setProcessingId(id);
    try {
      await api.registrations.acceptTeamInvite(teamId, eventId);
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, inviteStatus: 'approved', isRead: true } : n));
      const targetTeam = teamName || message.match(/join team (.+?) for/)?.[1] || "the team";
      setSuccessDialogMessage(`You have joined the team ${targetTeam}, for any query contact the team leader.`);
      setSuccessDialogOpen(true);
    } catch (err) {
      alert("Failed to accept invite: " + getErrorMessage(err));
    } finally {
      setProcessingId(null);
      setInviteToAccept(null);
    }
  };

  const confirmDecline = async () => {
    if (!inviteToReject?.teamId || !inviteToReject.eventId) return;
    const { id, teamId, eventId } = inviteToReject;
    setProcessingId(id);
    try {
      await api.registrations.declineTeamInvite(teamId, eventId);
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, inviteStatus: 'rejected', isRead: true } : n));
    } catch (err) {
      alert("Failed to decline invite: " + getErrorMessage(err));
    } finally {
      setProcessingId(null);
      setInviteToReject(null);
    }
  };

  const getTitleDesc = (n: NotificationItem) => {
    if (n.type === 'team_invite') {
      const teamName = n.teamName || n.message.match(/join team (.+?) for/)?.[1] || "the team";
      const eventTitle = n.eventTitle || "the event";
      if (n.inviteStatus === 'approved') {
        return {
          title: "Team Invite Accepted",
          desc: `You joined ${teamName} for the event ${eventTitle}.`
        };
      }
      if (n.inviteStatus === 'rejected') {
        return {
          title: "Team Invite Rejected",
          desc: `You declined the invite to join ${teamName} for the event ${eventTitle}.`
        };
      }
      return {
        title: n.title || "Team Invite received",
        desc: n.message || `${n.senderName || 'Someone'} invited you to join ${teamName} for the event ${eventTitle}.`
      };
    }
    return {
      title: n.title,
      desc: n.message
    };
  };

  const getBadgeInfo = (type: string) => {
    switch(type) {
      case 'team_invite':
        return { icon: Users, text: "Team Invite", color: "text-[#111111]" };
      case 'registration_approved':
      case 'registration_rejected':
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
      <div className="pt-24 pb-20 px-[10%] w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5EA] pb-3 mb-6">
          <div className="flex items-center gap-6 shrink-0">
            {(["All", "Invites", "General"] as const).map(tab => {
              const key = tab.toLowerCase() as "all" | "invites" | "general";
              return (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(key)}
                  className={`h-9 flex items-center text-sm font-medium transition-all relative ${activeTab === key ? "text-[#111111]" : "text-[#6E6E73] hover:text-[#111111]"}`}
                >
                  {tab}
                  {activeTab === key && (
                    <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-[#cfe467] rounded-t-md" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-[260px] lg:w-[300px] md:flex-initial">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7]" />
              <input 
                type="text" 
                placeholder="Search for notification" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-white border border-[#E5E5EA] rounded-lg text-sm text-[#111111] placeholder:text-[#9E9EA7] focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all"
              />
            </div>
            <button onClick={handleRefresh} className="h-9 w-9 flex items-center justify-center bg-white border border-[#E5E5EA] rounded-lg text-[#111111] hover:bg-[#F5F5F7] transition-all shrink-0" title="Refresh">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={markAllAsRead} className="h-9 px-4 flex items-center justify-center bg-white border border-[#E5E5EA] rounded-lg text-[13px] font-medium text-[#111111] hover:bg-[#cfe467]/20 hover:border-[#cfe467] hover:text-[#111111] transition-all whitespace-nowrap shrink-0">
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
              You&apos;re all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map(notif => {
              const { title, desc } = getTitleDesc(notif);
              const badge = getBadgeInfo(notif.type);
              return (
                <div 
                  key={notif.id} 
                  onClick={() => { if (!notif.isRead && notif.type !== 'team_invite') markSingleAsRead(notif.id); }}
                  className={`flex items-center justify-between py-4 border-b border-[#E5E5EA] group -mx-4 px-4 transition-colors rounded-xl cursor-pointer ${
                    !notif.isRead ? 'bg-[#cfe467]/10 hover:bg-[#cfe467]/20' : 'hover:bg-[#F9F9F9]'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0 pr-4">
                    <div className="mt-1.5 shrink-0 flex items-center justify-center w-2">
                      {!notif.isRead && (
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
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>

                    {notif.type === 'team_invite' && (!notif.inviteStatus || notif.inviteStatus === 'pending') && !notif.isRead && (
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
                Are you sure you want to reject the invite to join the team <span className="font-semibold text-[#111111]">{inviteToReject?.teamName || inviteToReject?.message.match(/join team (.+?) for/)?.[1] || "the team"}</span>?
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
                Are you sure you want to join the team <span className="font-semibold text-[#111111]">{inviteToAccept?.teamName || inviteToAccept?.message.match(/join team (.+?) for/)?.[1] || "the team"}</span>?
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
