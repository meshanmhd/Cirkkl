"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft, LayoutDashboard, Users, CheckSquare, Shield,
  Calendar, MapPin, Globe, Tag, Eye, EyeOff,
  Edit, Trash2, Search, Check, X, AlertTriangle, UserPlus, Download, ScanLine, Image as ImageIcon, MoreHorizontal, RefreshCw, ChevronDown, Plus, FileText, CheckCircle2, Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DotQRCode } from "@/components/ui/DotQRCode";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "registration", label: "Registration", icon: Users },
  { id: "attendance", label: "Attendance", icon: CheckSquare },
  { id: "roles", label: "Roles", icon: Shield },
];

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", desc: "Full access" },
  { value: "manager", label: "Manager", desc: "Registration + Attendance" },
  { value: "viewer", label: "Viewer", desc: "Attendance only" },
];

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
}
function formatDate(d: string | null) {
  if (!d) return "-";
  // Ensure YYYY-MM-DD doesn't shift timezones by treating it as local midnight instead of UTC
  const dateObj = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d: string | null) {
  if (!d) return "-";
  // If the database string doesn't specify timezone, force it to be UTC so it converts to local correctly
  const dateStr = (d.includes('Z') || d.includes('+')) ? d : `${d}Z`;
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function SectionCard({ id, title, subtitle, action, children }: { id: string; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <div id={id} className="bg-white rounded-[20px] border border-[#E5E5EA] scroll-mt-8">
      <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#111111]">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#6E6E73] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-6 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-[#F7F7F8] rounded-[14px] p-4 flex flex-col gap-1">
      <p className="text-[12px] text-[#6E6E73] font-medium">{label}</p>
      <p className="text-[24px] font-bold" style={{ color: color ?? "#111111" }}>{value}</p>
    </div>
  );
}

interface Props {
  event: any;
  registrations: any[];
  profiles: any[];
  orgMembers: any[];
  eventRoles: any[];
  eventId: string;
  teams?: any[];
  teamMembers?: any[];
}
export function EventManagePage({ event: initialEvent, registrations: initialRegs, profiles, orgMembers, eventRoles: initialRoles, eventId, teams = [], teamMembers = [] }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState("overview");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [event, setEvent] = useState(initialEvent);
  const [regs, setRegs] = useState(initialRegs);
  const [eventRoles, setEventRoles] = useState(initialRoles);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [regSearch, setRegSearch] = useState("");
  const [regFilterStatus, setRegFilterStatus] = useState("all");
  const [attSearch, setAttSearch] = useState("");
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addRoleMember, setAddRoleMember] = useState<string>("");
  const [addRoleValue, setAddRoleValue] = useState("viewer");
  const [savingRole, setSavingRole] = useState(false);
  const [viewingReg, setViewingReg] = useState<any>(null);
  const [regToDelete, setRegToDelete] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const sectionIds = SECTIONS.map(s => s.id);



  const profileMap = useMemo(() => {
    const m: Record<string, any> = {};
    profiles.forEach(p => { m[p.id] = p; });
    return m;
  }, [profiles]);

  const memberMap = useMemo(() => {
    const m: Record<string, any> = {};
    (orgMembers || []).forEach(mObj => { m[mObj.id] = mObj; });
    return m;
  }, [orgMembers]);

  const teamMap = useMemo(() => {
    const m: Record<string, any> = {};
    teams.forEach(t => { m[t.id] = t; });
    return m;
  }, [teams]);

  const teamMembersByTeam = useMemo(() => {
    const m: Record<string, any[]> = {};
    teamMembers.forEach(tm => {
      if (!m[tm.team_id]) m[tm.team_id] = [];
      m[tm.team_id].push(tm);
    });
    return m;
  }, [teamMembers]);

  const filteredRegs = useMemo(() => regs.filter(r => {
    if (regFilterStatus !== "all" && r.status !== regFilterStatus) return false;
    const p = profileMap[r.user_id];
    const term = regSearch.toLowerCase();
    return !term || p?.full_name?.toLowerCase().includes(term) || p?.email?.toLowerCase().includes(term) || r.ticket_code?.toLowerCase().includes(term);
  }), [regs, regSearch, regFilterStatus, profileMap]);

  const approvedRegs = useMemo(() => regs.filter(r => r.status === "approved"), [regs]);
  const filteredAtt = useMemo(() => regs.filter(r => {
    if (!r.attended) return false;
    const p = profileMap[r.user_id];
    const term = attSearch.toLowerCase();
    return !term || p?.full_name?.toLowerCase().includes(term) || p?.email?.toLowerCase().includes(term);
  }), [regs, attSearch, profileMap]);

  const attendedCount = regs.filter(r => r.attended).length;
  const isPublished = event.status === "published";

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("events").delete().eq("id", eventId);
    router.push("/dashboard/events");
  }

  async function togglePublish() {
    setToggling(true);
    const newStatus = isPublished ? "draft" : "published";
    await supabase.from("events").update({ status: newStatus }).eq("id", eventId);
    setEvent((e: any) => ({ ...e, status: newStatus }));
    setToggling(false);
  }

  async function approveReg(id: string) {
    await supabase.from("registrations").update({ status: "approved" }).eq("id", id);
    setRegs((prev: any[]) => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
  }

  async function rejectReg(id: string) {
    await supabase.from("registrations").update({ status: "rejected" }).eq("id", id);
    setRegs((prev: any[]) => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
  }

  async function deleteReg(id: string) {
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) {
      console.error("Error deleting registration:", error);
      alert("Failed to delete registration. Make sure you have the necessary permissions (RLS).");
      return;
    }
    setRegs((prev: any[]) => prev.filter(r => r.id !== id));
    setViewingReg(null);
  }

  async function toggleAttendance(regId: string, current: boolean) {
    await supabase.from("registrations").update({ attended: !current }).eq("id", regId);
    setRegs((prev: any[]) => prev.map(r => r.id === regId ? { ...r, attended: !current } : r));
  }

  async function refreshData() {
    setRefreshing(true);
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (data) setRegs(data);
    setRefreshing(false);
  }

  async function addRole() {
    if (!addRoleMember) return;
    setSavingRole(true);
    const { data } = await supabase.from("event_roles").insert({ event_id: eventId, user_id: addRoleMember, role: addRoleValue }).select().single();
    if (data) setEventRoles((prev: any[]) => [...prev, data]);
    setAddRoleOpen(false);
    setAddRoleMember("");
    setAddRoleValue("viewer");
    setSavingRole(false);
  }

  async function removeRole(id: string) {
    await supabase.from("event_roles").delete().eq("id", id);
    setEventRoles((prev: any[]) => prev.filter(r => r.id !== id));
  }

  function exportCSV() {
    const rows = [
      ["Name", "Email", "Ticket Code", "Status", "Registered At"],
      ...regs.map((r: any) => {
        const p = profileMap[r.user_id];
        return [p?.full_name ?? "-", p?.email ?? "-", r.ticket_code ?? "-", r.status ?? "-", formatDateTime(r.created_at)];
      })
    ];
    const csv = rows.map(r => r.map((c: string) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${event.title}-registrations.csv`; a.click();
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center -mt-6 md:-mt-8">
      <div className="sticky top-[56px] z-20 w-full max-w-6xl mx-auto px-6 pt-6 pb-2 bg-[#F7F7F8]">
        <div className="bg-white rounded-[20px] border border-[#E5E5EA] px-4 h-[64px] flex items-center gap-4 shadow-sm">
          <Link href="/dashboard/events" className="flex items-center gap-2 text-[13px] font-medium text-[#6E6E73] hover:text-[#111111] transition-colors">
            <ArrowLeft size={15} strokeWidth={2} />
            Events
          </Link>
          <div className="w-px h-4 bg-[#E5E5EA]" />
          <p className="text-[14px] font-semibold text-[#111111] truncate flex-1">{event.title}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={refreshData} disabled={refreshing} className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-[#E5E5EA] text-[#6E6E73] hover:bg-[#F5F5F7] transition-all disabled:opacity-50">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <Link href={`/dashboard/events/${eventId}/attendance`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E5EA] text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all">
              <ScanLine size={13} />
              Mark Attendance
            </Link>
            <button onClick={togglePublish} disabled={toggling} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E5EA] text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all disabled:opacity-50">
              {isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
              {isPublished ? "Unpublish" : "Publish"}
            </button>
            <Link href={`/dashboard/events/${eventId}/edit`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold text-[#111111] transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #cfe467 0%, #c0d955 100%)" }}>
              <Edit size={13} />
              Edit
            </Link>
            <button onClick={() => setDeleteConfirm(true)} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#9E9EA7] hover:text-red-500 hover:bg-red-50 transition-all">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 px-6 pt-2 pb-4 max-w-6xl mx-auto w-full">
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-[160px] bg-white rounded-[20px] border border-[#E5E5EA] p-2 flex flex-col gap-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${activeSection === id ? "text-[#111111] shadow-sm" : "text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7]"}`}
                style={activeSection === id ? { background: "linear-gradient(135deg, #cfe467 0%, #c8de58 100%)" } : {}}>
                <Icon size={14} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-5 pb-20">
          {activeSection === "overview" && (
            <SectionCard id="overview" title="Overview" subtitle="Event details as seen by attendees">
              <div className="flex gap-4 mb-8 h-[240px]">
                {event.poster_image && (
                  <div className="h-full aspect-[9/16] rounded-[14px] overflow-hidden bg-[#F5F5F7] shrink-0 border border-[#E5E5EA] shadow-sm">
                    <img src={event.poster_image} alt={`${event.title} Poster`} className="w-full h-full object-cover" />
                  </div>
                )}
                {event.image && (
                  <div className="h-full flex-1 rounded-[14px] overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] shadow-sm relative">
                    <img src={event.image} alt={`${event.title} Banner`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[14px]"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-4">Basic Info</h3>
                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="text-[12px] font-semibold text-[#6E6E73] mb-1">Title</p>
                      <p className="text-[15px] font-medium text-[#111111]">{event.title}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#6E6E73] mb-1">Description</p>
                      <p className="text-[14px] text-[#111111] whitespace-pre-line leading-relaxed">{event.description || "Null"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-4">Logistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Event Type</p>
                      <p className="text-[13px] font-medium text-[#111111] capitalize">{event.location_type || "Null"}</p>
                    </div>
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Start Date & Time</p>
                      <p className="text-[13px] font-medium text-[#111111]">
                        {event.date ? `${formatDate(event.date)} ${event.time ? `at ${event.time}` : ""}` : "Null"}
                      </p>
                    </div>
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">End Date & Time</p>
                      <p className="text-[13px] font-medium text-[#111111]">
                        {event.end_date ? `${formatDate(event.end_date)} ${event.end_time ? `at ${event.end_time}` : ""}` : "Null"}
                      </p>
                    </div>
                  </div>
                  {(event.location_type === "physical" || event.location_type === "hybrid") && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Venue Name</p>
                        <p className="text-[13px] font-medium text-[#111111] truncate">{event.venue || "Null"}</p>
                      </div>
                      <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">City</p>
                        <p className="text-[13px] font-medium text-[#111111] truncate">{event.city || "Null"}</p>
                      </div>
                      <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Location Link</p>
                        <p className="text-[13px] font-medium text-[#111111] truncate">{event.location_link || event.location || "Null"}</p>
                      </div>
                    </div>
                  )}
                  {(event.location_type === "online" || event.location_type === "hybrid") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Platform</p>
                        <p className="text-[13px] font-medium text-[#111111] truncate">{event.platform || "Null"}</p>
                      </div>
                      <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Meeting Link</p>
                        <p className="text-[13px] font-medium text-[#111111] truncate">
                          {event.meeting_link ? (
                            <a href={event.meeting_link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{event.meeting_link}</a>
                          ) : "Null"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-4">Ticketing & Capacity</h3>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Event Type</p>
                        <p className="text-[13px] font-medium text-[#111111] capitalize">{event.price || "Null"}</p>
                      </div>
                      <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Total Capacity</p>
                        <p className="text-[13px] font-medium text-[#111111]">
                          {event.seats ? `${event.seats} seats` : (event.seats === null ? "Unlimited" : "Null")}
                        </p>
                      </div>
                    </div>

                    {event.price === "paid" && (
                      <div className="mt-1">
                        <p className="text-[12px] font-semibold text-[#111111] mb-2">Ticket Tiers</p>
                        {Array.isArray(event.ticket_types) && event.ticket_types.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {event.ticket_types.map((t: any, i: number) => (
                              <div key={i} className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-dashed border-[#E5E5EA] flex items-center justify-between">
                                <div>
                                  <p className="text-[13px] font-bold text-[#111111]">{t.name || "Null"}</p>
                                  <p className="text-[12px] text-[#6E6E73] mt-0.5">Capacity: {t.unlimited ? "Unlimited" : (t.quantity ? `${t.quantity} seats` : "Null")}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  {t.qr_code_url && (
                                    <div className="shrink-0 flex items-center">
                                      <a href={t.qr_code_url} target="_blank" rel="noreferrer" className="block relative group">
                                        <img src={t.qr_code_url} alt="Payment QR" className="w-10 h-10 rounded-[8px] object-cover border border-[#E5E5EA] shadow-sm group-hover:border-[#cfe467] transition-colors" />
                                      </a>
                                    </div>
                                  )}
                                  <div className="text-right">
                                    <p className="text-[14px] font-bold text-[#111111]">₹{t.price || "0"}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-dashed border-[#E5E5EA] flex items-center justify-between">
                            <div>
                              <p className="text-[13px] font-bold text-[#111111]">General Admission</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[14px] font-bold text-[#111111]">₹{event.price_amount || "0"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Registration Deadline</p>
                      <p className="text-[13px] font-medium text-[#111111]">
                        {event.registration_deadline ? `${formatDate(event.registration_deadline)} ${event.registration_end_time ? `at ${event.registration_end_time}` : ""}` : "Null"}
                      </p>
                    </div>
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Approval Required</p>
                      <p className="text-[13px] font-medium text-[#111111]">{event.approval_required ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-4">Policies</h3>
                  <div className="flex flex-col gap-3">
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Cancellation Policy</p>
                      <p className="text-[13px] font-medium text-[#111111] whitespace-pre-line">{event.cancellation_policy || "Null"}</p>
                    </div>
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Refund Policy</p>
                      <p className="text-[13px] font-medium text-[#111111] whitespace-pre-line">{event.refund_policy || "Null"}</p>
                    </div>
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Photography Policy</p>
                      <p className="text-[13px] font-medium text-[#111111] whitespace-pre-line">{event.photography_policy || "Null"}</p>
                    </div>
                  </div>
                </div>

                {(event.hosts?.length > 0 || event.speakers?.length > 0) && (
                  <div>
                    <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-4">Hosts & Speakers</h3>
                    <div className="flex flex-col gap-4 mb-4">
                      {event.hosts?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Hosts</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {event.hosts.map((hostId: string) => {
                              const m = memberMap[hostId];
                              return (
                                <div key={hostId} className="flex items-center gap-3 bg-[#F5F5F7] p-3 rounded-[12px] border border-[#E5E5EA]">
                                  {m?.avatar_url ? (
                                    <img src={m.avatar_url} alt={m.name || m.full_name} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center text-[10px] font-bold text-[#6E6E73]">
                                      {(m?.name || m?.full_name || "?").substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-[13px] font-medium text-[#111111]">{m?.name || m?.full_name || "Unknown"}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {event.speakers?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Speakers</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {event.speakers.map((s: any) => (
                              <div key={s.id} className="flex items-center gap-3 bg-[#F5F5F7] p-3 rounded-[12px] border border-[#E5E5EA]">
                                {s.imageUrl ? (
                                  <img src={s.imageUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#E5E5EA] flex items-center justify-center text-[12px] font-bold text-[#6E6E73]">
                                    {(s.name || "?").substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-[13px] font-medium text-[#111111]">{s.name}</p>
                                  {s.subtext && <p className="text-[11px] text-[#6E6E73]">{s.subtext}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-4">Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Visibility</p>
                      <p className="text-[13px] font-medium text-[#111111] capitalize">{event.visibility || "Null"}</p>
                    </div>
                    <div className="bg-[#F5F5F7] p-3.5 rounded-[12px] border border-[#E5E5EA]">
                      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">Category</p>
                      <p className="text-[13px] font-medium text-[#111111]">{event.category || "Null"}</p>
                    </div>
                  </div>
                </div>

                {Array.isArray(event.tags) && event.tags.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag: string) => (
                        <span key={tag} className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] text-[#111111]">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {activeSection === "registration" && (
            <SectionCard id="registration" title="Registration" subtitle="Participants who have registered for this event"
              action={<button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E5EA] text-[12px] font-medium text-[#6E6E73] hover:bg-[#F5F5F7] transition-all"><Download size={12} />Export CSV</button>}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Total" value={regs.length} />
                <StatCard label="Approved" value={regs.filter((r: any) => r.status === "approved").length} color="#34C759" />
                <StatCard label="Pending" value={regs.filter((r: any) => r.status === "pending").length} color="#FF9500" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7] pointer-events-none" style={{ width: "14px", height: "14px" }} />
                  <input placeholder="Search by name, email or ticket code..." value={regSearch} onChange={e => setRegSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px] text-[#111111] placeholder:text-[#9E9EA7] outline-none focus:border-[#cfe467] focus:ring-1 focus:ring-[#cfe467] transition-all" />
                </div>
                <div className="flex bg-[#F5F5F7] p-1 rounded-[10px] w-full sm:w-[280px]">
                  {["all", "approved", "pending"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setRegFilterStatus(tab)}
                      className={`flex-1 text-[13px] font-medium py-1.5 rounded-[8px] transition-all capitalize ${regFilterStatus === tab ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6E6E73] hover:text-[#111111]'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded-[12px] border border-[#E5E5EA]">
                <table className="w-full">
                  <thead><tr className="border-b border-[#E5E5EA]">{[event.is_team_event ? "TEAM" : "PARTICIPANT", "TICKET CODE", "STATUS", "REGISTERED", ""].map(col => (<th key={col} className={`px-5 py-3 text-[11px] font-medium text-[#9E9EA7] tracking-[0.05em] uppercase whitespace-nowrap ${col === "TEAM" || col === "PARTICIPANT" ? "text-left" : "text-center"}`}>{col}</th>))}</tr></thead>
                  <tbody>
                    {filteredRegs.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-[13px] text-[#9E9EA7]">No registrations yet</td></tr>
                    ) : filteredRegs.map((r: any, idx: number) => {
                      const p = profileMap[r.user_id];
                      const team = r.team_id ? teamMap[r.team_id] : (event.is_team_event ? teams.find((t: any) => t.leader_id === r.user_id) : null);
                      let displayName = p?.full_name ?? "-";
                      let subtitle = p?.email ?? "-";
                      if (event.is_team_event && team) {
                        displayName = team.name;
                        subtitle = `Leader: ${p?.full_name ?? p?.email ?? "-"}`;
                      }
                      return (
                        <tr key={r.id} onClick={() => setViewingReg(r)} className={`cursor-pointer border-b border-[#F5F5F7] hover:bg-[#FAFAFA] transition-colors ${idx === filteredRegs.length - 1 ? "border-b-0" : ""}`}>
                          <td className="px-5 py-3"><div className="flex items-center gap-2.5"><Avatar className="h-7 w-7 border border-[#E5E5EA] shrink-0">
                            {event.is_team_event && team ? (
                              <AvatarFallback className="text-[10px] font-medium bg-[#cfe467] text-[#4a6000]"><Users size={12} /></AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={p?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${r.user_id}`} />
                                <AvatarFallback className="text-[10px] font-medium bg-[#F5F5F7]">{getInitials(displayName)}</AvatarFallback>
                              </>
                            )}
                          </Avatar><div className="min-w-0"><p className="text-[13px] font-medium text-[#111111] truncate">{displayName}</p><p className="text-[11px] text-[#9E9EA7] truncate">{subtitle}</p></div></div></td>
                          <td className="px-5 py-3 text-center"><span className="text-[13px] text-[#6E6E73]">{r.ticket_code ?? "-"}</span></td>
                          <td className="px-5 py-3 text-center"><span className="text-[13px] text-[#6E6E73] capitalize">{r.attended ? "attended" : (r.status ?? "-")}</span></td>
                          <td className="px-5 py-3 text-center"><span className="text-[13px] text-[#6E6E73] whitespace-nowrap">{formatDateTime(r.created_at)}</span></td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9EA7] hover:bg-[#F5F5F7] hover:text-[#111111] transition-all outline-none">
                                  <MoreHorizontal size={16} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#E5E5EA] shadow-lg p-1.5 z-[100] bg-white">
                                  <DropdownMenuItem onClick={() => setRegToDelete(r)} className="group text-red-500 hover:text-[#111111] focus:text-[#111111] hover:bg-[#F5F5F7] focus:bg-[#F5F5F7] text-[13px] font-medium cursor-pointer flex items-center gap-2 py-2.5 px-3 rounded-lg outline-none transition-colors">
                                    <Trash2 size={15} className="text-red-500 group-hover:text-[#111111] group-focus:text-[#111111] transition-colors" /> Cancel Registration
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {activeSection === "attendance" && (
            <SectionCard id="attendance" title="Attendance" subtitle="Mark attendance for approved registrants"
              action={<div className="text-[13px] text-[#6E6E73]"><span className="font-bold text-[#111111]">{attendedCount}</span> / {approvedRegs.length} attended</div>}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7] pointer-events-none" style={{ width: "14px", height: "14px" }} />
                <input placeholder="Search attendees..." value={attSearch} onChange={e => setAttSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px] text-[#111111] placeholder:text-[#9E9EA7] outline-none focus:border-[#cfe467] focus:ring-1 focus:ring-[#cfe467] transition-all" />
              </div>
              <div className="overflow-x-auto rounded-[12px] border border-[#E5E5EA]">
                <table className="w-full">
                  <thead><tr className="border-b border-[#E5E5EA]">{["PARTICIPANT", "TICKET CODE", "TIME"].map(col => (<th key={col} className={`px-5 py-3 text-[11px] font-medium text-[#9E9EA7] tracking-[0.05em] uppercase whitespace-nowrap ${col === "PARTICIPANT" ? "text-left" : "text-center"}`}>{col}</th>))}</tr></thead>
                  <tbody>
                    {filteredAtt.length === 0 ? (
                      <tr><td colSpan={3} className="py-12 text-center text-[13px] text-[#9E9EA7]">No approved registrants yet</td></tr>
                    ) : filteredAtt.map((r: any, idx: number) => {
                      const p = profileMap[r.user_id];
                      return (
                        <tr key={r.id} className={`border-b border-[#F5F5F7] hover:bg-[#FAFAFA] transition-colors ${idx === filteredAtt.length - 1 ? "border-b-0" : ""}`}>
                          <td className="px-5 py-3"><div className="flex items-center gap-2.5"><Avatar className="h-7 w-7 border border-[#E5E5EA] shrink-0"><AvatarImage src={p?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${r.user_id}`} /><AvatarFallback className="text-[10px] font-medium bg-[#F5F5F7]">{getInitials(p?.full_name)}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-[13px] font-medium text-[#111111] truncate">{p?.full_name ?? "-"}</p><p className="text-[11px] text-[#9E9EA7] truncate">{p?.email ?? "-"}</p></div></div></td>
                          <td className="px-5 py-3 text-center"><span className="text-[13px] text-[#6E6E73]">{r.ticket_code ?? "-"}</span></td>
                          <td className="px-5 py-3 text-center"><span className="text-[13px] text-[#6E6E73] whitespace-nowrap">{r.attended_at ? formatDateTime(r.attended_at) : formatDateTime(r.created_at)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {activeSection === "roles" && (
            <SectionCard id="roles" title="Roles" subtitle="Grant org members access to manage this event"
              action={<button onClick={() => setAddRoleOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold text-[#111111] transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #cfe467 0%, #c0d955 100%)" }}><UserPlus size={13} />Add Member</button>}>
              <div className="flex flex-col gap-2 text-[12px] text-[#6E6E73] mb-1">
                {ROLE_OPTIONS.map(r => (<div key={r.value} className="flex items-center gap-2"><span className="font-semibold text-[#111111] w-16">{r.label}</span><span>{r.desc}</span></div>))}
              </div>
              <div className="overflow-x-auto rounded-[12px] border border-[#E5E5EA]">
                <table className="w-full">
                  <thead><tr className="border-b border-[#E5E5EA]">{["MEMBER", "ROLE", ""].map(col => (<th key={col} className={`px-5 py-3 text-[11px] font-medium text-[#9E9EA7] tracking-[0.05em] uppercase whitespace-nowrap ${col === "MEMBER" ? "text-left" : "text-center"}`}>{col}</th>))}</tr></thead>
                  <tbody>
                    {eventRoles.length === 0 ? (
                      <tr><td colSpan={3} className="py-12 text-center text-[13px] text-[#9E9EA7]">No roles assigned yet</td></tr>
                    ) : eventRoles.map((er: any, idx: number) => {
                      const m = orgMembers.find((om: any) => om.id === er.user_id);
                      return (
                        <tr key={er.id} className={`border-b border-[#F5F5F7] hover:bg-[#FAFAFA] transition-colors ${idx === eventRoles.length - 1 ? "border-b-0" : ""}`}>
                          <td className="px-5 py-3"><div className="flex items-center gap-2.5"><Avatar className="h-7 w-7 border border-[#E5E5EA] shrink-0"><AvatarImage src={m?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${er.user_id}`} /><AvatarFallback className="text-[10px] font-medium bg-[#F5F5F7]">{getInitials(m?.full_name)}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-[13px] font-medium text-[#111111] truncate">{m?.full_name ?? "Unknown"}</p><p className="text-[11px] text-[#9E9EA7] truncate">{m?.email ?? "-"}</p></div></div></td>
                          <td className="px-5 py-3 text-center"><span className="text-[13px] font-medium text-[#111111] capitalize">{er.role}</span></td>
                          <td className="px-5 py-3 text-right"><button onClick={() => removeRole(er.id)} className="w-7 h-7 rounded-[6px] flex items-center justify-center ml-auto text-[#9E9EA7] hover:text-red-500 hover:bg-red-50 transition-all"><X size={13} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm rounded-[20px] p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3"><AlertTriangle className="text-red-500" size={22} /></div>
            <DialogTitle className="text-center text-[16px] font-bold text-[#111111]">Delete Event?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[#6E6E73] text-center mt-1">This will permanently delete this event and all its registrations. This cannot be undone.</p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2.5 rounded-[10px] border border-[#E5E5EA] text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-[10px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-all disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
        <DialogContent className="max-w-sm rounded-[20px] p-6">
          <DialogHeader><DialogTitle className="text-[16px] font-bold text-[#111111]">Assign Role</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="text-[12px] font-semibold text-[#111111] mb-2 block">Member</label>
              <select value={addRoleMember} onChange={e => setAddRoleMember(e.target.value)} className="w-full px-3 py-2 rounded-[10px] border border-[#E5E5EA] bg-white text-[13px] text-[#111111] outline-none focus:border-[#cfe467] transition-all">
                <option value="">Select a member...</option>
                {orgMembers.filter((m: any) => !eventRoles.find((er: any) => er.user_id === m.id)).map((m: any) => (<option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#111111] mb-2 block">Role</label>
              <div className="flex flex-col gap-2">
                {ROLE_OPTIONS.map(r => (
                  <button key={r.value} onClick={() => setAddRoleValue(r.value)} className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] border text-left transition-all ${addRoleValue === r.value ? "border-[#cfe467] bg-[#cfe467]/10" : "border-[#E5E5EA] hover:bg-[#F5F5F7]"}`}>
                    <div><p className="text-[13px] font-semibold text-[#111111]">{r.label}</p><p className="text-[11px] text-[#6E6E73]">{r.desc}</p></div>
                    {addRoleValue === r.value && <Check size={14} className="text-[#111111] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-1">
              <button onClick={() => setAddRoleOpen(false)} className="flex-1 py-2.5 rounded-[10px] border border-[#E5E5EA] text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all">Cancel</button>
              <button onClick={addRole} disabled={!addRoleMember || savingRole} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#111111] transition-all disabled:opacity-50 hover:opacity-90" style={{ background: "linear-gradient(135deg, #cfe467 0%, #c0d955 100%)" }}>{savingRole ? "Saving..." : "Assign"}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Details Modal */}
      <Dialog open={!!viewingReg} onOpenChange={(open) => !open && setViewingReg(null)}>
        <DialogContent className="max-w-sm rounded-[24px] p-0 overflow-hidden border border-[#E5E5EA] bg-white [&>button]:hidden">
          {viewingReg && (
            <div className="flex flex-col max-h-[85vh] bg-white">

              {/* Header */}
              <div className="px-5 py-4 shrink-0 flex items-center justify-between border-b border-[#E5E5EA]">
                <DialogTitle className="text-[15px] font-bold text-[#111111] tracking-tight">Registration Details</DialogTitle>
                <button onClick={() => setViewingReg(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors outline-none">
                  <X size={15} />
                </button>
              </div>

              <div className="overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#E5E5EA] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">

                {/* User Info */}
                {(() => {
                  const p = profileMap[viewingReg.user_id];
                  const team = viewingReg.team_id ? teamMap[viewingReg.team_id] : (event.is_team_event ? teams.find((t: any) => t.leader_id === viewingReg.user_id) : null);
                  
                  if (event.is_team_event && team) {
                    const members = teamMembersByTeam[team.id] || [];
                    const acceptedCount = members.filter((m: any) => m.status === 'approved').length + 1;
                    
                    return (
                      <div className="flex flex-col">
                        <div className="px-5 py-5 flex flex-col gap-4">
                          <div>
                            <p className="text-[18px] font-bold text-[#111111] leading-tight truncate">{team.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Ticket Code</p>
                              <p className="text-[13px] font-mono font-bold text-[#111111] bg-[#F5F5F7] px-2 py-0.5 rounded-md">{viewingReg.ticket_code ?? "—"}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA]">
                            <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Status</p>
                              <span className={`text-[13px] font-semibold capitalize inline-flex items-center gap-1.5 ${
                                viewingReg.attended ? "text-emerald-600"
                                : viewingReg.status === "approved" ? "text-[#4a6000]"
                                : viewingReg.status === "pending" ? "text-amber-600"
                                : viewingReg.status === "rejected" ? "text-red-600"
                                : "text-[#6E6E73]"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  viewingReg.attended ? "bg-emerald-500"
                                  : viewingReg.status === "approved" ? "bg-[#cfe467]"
                                  : viewingReg.status === "pending" ? "bg-amber-400"
                                  : viewingReg.status === "rejected" ? "bg-red-500"
                                  : "bg-[#D1D1D6]"
                                }`} />
                                {viewingReg.attended ? "Attended" : (viewingReg.status ?? "—")}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Registered</p>
                              <p className="text-[13px] font-medium text-[#111111]">{formatDateTime(viewingReg.created_at)}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 mt-1">
                             <div className="flex justify-between items-center">
                                <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Team Members</p>
                                <p className="text-[11px] text-[#6E6E73] font-medium">{acceptedCount} / {event.team_min_size} approved</p>
                             </div>
                            <div className="flex flex-col gap-2">
                               <div className="flex justify-between items-center p-3 rounded-[12px] bg-[#F5F5F7]">
                                  <span className="text-[13px] font-medium text-[#111111]">{p?.full_name ?? p?.email}</span>
                                  <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Leader</span>
                               </div>
                               {members.map(m => {
                                 const mp = profileMap[m.user_id];
                                 return (
                                   <div key={m.id} className="flex justify-between items-center p-3 rounded-[12px] border border-[#E5E5EA]">
                                      <span className="text-[13px] font-medium text-[#111111]">{mp?.full_name ?? mp?.email ?? "Unknown"}</span>
                                      <span className={`text-[11px] font-bold uppercase tracking-wider ${m.status === 'approved' ? 'text-emerald-600' : m.status === 'rejected' ? 'text-red-600' : 'text-amber-500'}`}>{m.status}</span>
                                   </div>
                                 )
                               })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <div className="px-5 py-5 flex items-center gap-4">
                        <Avatar className="h-12 w-12 shrink-0 border border-[#E5E5EA]">
                          <AvatarImage src={p?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${viewingReg.user_id}`} />
                          <AvatarFallback className="text-[14px] font-semibold bg-[#F5F5F7] text-[#111111]">{getInitials(p?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-[#111111] leading-tight truncate">{p?.full_name ?? "—"}</p>
                          <p className="text-[13px] text-[#6E6E73] font-medium mt-0.5 truncate">{p?.email ?? "—"}</p>
                        </div>
                      </div>

                      <div className="h-px bg-[#E5E5EA] mx-5" />

                      {/* Ticket & Status */}
                      <div className="px-5 py-4 grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Ticket Code</p>
                            <p className="text-[13px] font-mono font-bold text-[#111111]">{viewingReg.ticket_code ?? "—"}</p>
                          </div>
                          {viewingReg.ticket_code && (
                            <div className="w-[120px] h-[120px] bg-[#F5F5F7] rounded-[12px] flex items-center justify-center border border-[#E5E5EA] mt-1 shrink-0">
                              <DotQRCode value={viewingReg.ticket_code.toUpperCase()} size={100} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1">
                            <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Status</p>
                            <span className={`text-[13px] font-semibold capitalize inline-flex items-center gap-1.5 ${
                              viewingReg.attended ? "text-emerald-600"
                              : viewingReg.status === "approved" ? "text-[#4a6000]"
                              : viewingReg.status === "pending" ? "text-amber-600"
                              : viewingReg.status === "rejected" ? "text-red-600"
                              : "text-[#6E6E73]"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                viewingReg.attended ? "bg-emerald-500"
                                : viewingReg.status === "approved" ? "bg-[#cfe467]"
                                : viewingReg.status === "pending" ? "bg-amber-400"
                                : viewingReg.status === "rejected" ? "bg-red-500"
                                : "bg-[#D1D1D6]"
                              }`} />
                              {viewingReg.attended ? "Attended" : (viewingReg.status ?? "—")}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Registered</p>
                            <p className="text-[13px] font-medium text-[#111111]">{formatDateTime(viewingReg.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Payment Details */}
                {viewingReg.transaction_id && (
                  <>
                    <div className="h-px bg-[#E5E5EA] mx-5" />
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Payment</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <p className="text-[11px] text-[#9E9EA7] font-medium">Transaction ID</p>
                          <p className="text-[13px] font-mono font-bold text-[#111111]">{viewingReg.transaction_id}</p>
                        </div>
                        {viewingReg.payment_proof_url && (
                          <a href={viewingReg.payment_proof_url} target="_blank" rel="noreferrer"
                            className="flex items-center justify-between p-3 bg-[#F7F7F8] border border-[#E5E5EA] rounded-[12px] hover:bg-[#F0F0F2] transition-colors group mt-1">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E5EA] flex items-center justify-center shrink-0">
                                <ImageIcon size={14} className="text-[#9E9EA7]" />
                              </div>
                              <span className="text-[13px] font-medium text-[#111111]">Payment Receipt</span>
                            </div>
                            <Eye size={15} className="text-[#9E9EA7] group-hover:text-[#111111] transition-colors" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Custom Answers */}
                {viewingReg.custom_field_values && Object.keys(viewingReg.custom_field_values).length > 0 && (
                  <>
                    <div className="h-px bg-[#E5E5EA] mx-5" />
                    <div className="px-5 py-4 flex flex-col gap-3">
                      <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Responses</p>
                      <div className="flex flex-col gap-2.5">
                        {Object.entries(viewingReg.custom_field_values).map(([q, a]: any) => (
                          <div key={q} className="flex flex-col gap-0.5">
                            <p className="text-[11px] text-[#9E9EA7] font-medium">{q}</p>
                            <p className="text-[13px] font-medium text-[#111111]">{a || "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Approve / Reject Footer */}
              {event.approval_required && viewingReg.status === "pending" && (
                <div className="px-5 py-4 border-t border-[#E5E5EA] bg-white flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => { rejectReg(viewingReg.id); setViewingReg({...viewingReg, status: "rejected"}); }}
                    className="flex-1 py-2.5 bg-white text-[#111111] border border-[#E5E5EA] rounded-[12px] text-[13px] font-semibold hover:bg-[#F5F5F7] transition-colors outline-none"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { approveReg(viewingReg.id); setViewingReg({...viewingReg, status: "approved"}); }}
                    className="flex-1 py-2.5 bg-[#111111] text-white rounded-[12px] text-[13px] font-semibold hover:bg-[#222222] transition-colors outline-none"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Registration Confirmation Modal */}
      <Dialog open={!!regToDelete} onOpenChange={(open) => !open && setRegToDelete(null)}>
        <DialogContent className="max-w-sm rounded-[24px] p-6 overflow-hidden shadow-xl border border-[#E5E5EA] bg-white text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <div>
            <DialogTitle className="text-[17px] font-bold text-[#111111]">Remove Registration?</DialogTitle>
            <p className="text-[13px] text-[#6E6E73] mt-2">
              This action cannot be undone. Are you sure you want to permanently remove this registration?
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={() => setRegToDelete(null)}
              className="flex-1 px-4 py-2.5 bg-white border border-[#E5E5EA] rounded-[10px] text-[13px] font-semibold text-[#111111] hover:bg-[#F5F5F7] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteReg(regToDelete.id);
                setRegToDelete(null);
              }}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-[10px] text-[13px] font-semibold hover:bg-red-600 transition-colors"
            >
              Yes, Remove
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
