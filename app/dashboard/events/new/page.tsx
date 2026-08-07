"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft, Image as ImageIcon, Plus, X, Loader2,
  Upload, Globe, MapPin, Wifi, Car, UtensilsCrossed,
  Calendar, Clock, Users, FileText, Tag, Trash2, ChevronDown, Check,
  Info, ListPlus, Mic, Search, Eye, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES = ["General", "Technical", "Hackathons", "Cultural", "Workshops", "Seminars", "Sports", "Competitions", "Music"];
const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];
const SECTIONS = [
  { id: "basic", label: "Basic Info", icon: FileText },
  { id: "media", label: "Cover Media", icon: ImageIcon },
  { id: "datetime", label: "Date & Time", icon: Calendar },
  { id: "location", label: "Location", icon: MapPin },
  { id: "registration", label: "Registration", icon: Users },
  { id: "custom_fields", label: "Custom Fields", icon: ListPlus },
  { id: "hosts_speakers", label: "Hosts & Speakers", icon: Mic },
  { id: "policies", label: "Policies", icon: FileText },
];

type CustomField = { id: string; label: string; type: string; required: boolean; options: string };
type TicketType = { id: string; name: string; price: string; quantity: string; unlimited: boolean; qrCodeFile: File | null; qrCodePreview: string | null };
type ImageState = { file: File | null; preview: string | null };
type Speaker = { id: string; name: string; subtext: string; imageFile: File | null; imageUrl: string };
type Member = { id: string; name: string; avatar_url?: string };

function TabSwitcher({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
      <TabsList className="w-full flex bg-[#F5F5F7] p-1 rounded-xl">
        {options.map(opt => (
          <TabsTrigger key={opt.value} value={opt.value} className="flex-1 rounded-[10px] text-[13px] font-semibold data-[state=active]:bg-white data-[state=active]:text-[#111111] data-[state=active]:shadow-sm text-[#6E6E73] hover:text-[#111111] transition-all duration-200">
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const parts = raw.split(",").map(t => t.trim()).filter(Boolean);
    const next = [...new Set([...value, ...parts])].slice(0, 6);
    onChange(next);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    }
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => { if (input.trim()) addTag(input); };

  return (
    <div className="flex items-center gap-2 h-[46px] overflow-x-auto scrollbar-hide px-3 py-2 rounded-xl border border-[#E5E5EA] bg-white focus-within:border-[#cfe467] focus-within:ring-2 focus-within:ring-[#cfe467]/20 transition-all cursor-text whitespace-nowrap" onClick={() => { }}>
      {value.map((tag, i) => (
        <span key={i} className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F7] text-[#111111] text-[12px] font-semibold border border-[#E5E5EA]">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-[#6E6E73] hover:text-[#111111]">
            <X size={11} />
          </button>
        </span>
      ))}
      {value.length < 6 && (
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? "Type a tag and press Enter or comma…" : "Add more…"}
          className="flex-1 min-w-[120px] text-[14px] text-[#111111] placeholder:text-[#9E9EA7] bg-transparent outline-none"
        />
      )}
    </div>
  );
}

function CustomSelect({ options, value, onChange, placeholder }: {
  options: { value: string; label: string }[] | string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map(o =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const selected = normalizedOptions.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-[#111111] focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all"
      >
        <span className={selected ? "text-[#111111]" : "text-[#9E9EA7]"}>
          {selected?.label ?? placeholder ?? "Select…"}
        </span>
        <ChevronDown size={15} className={`text-[#6E6E73] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#E5E5EA] rounded-xl shadow-lg overflow-hidden">
          {normalizedOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-[14px] transition-colors hover:bg-[#F5F5F7] ${value === opt.value ? "text-[#111111] font-semibold" : "text-[#6E6E73]"}`}
            >
              {opt.label}
              {value === opt.value && <Check size={14} className="text-[#111111]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageUploadZone({ label, hint, aspectClass, value, onChange, required }: {
  label: string; hint: string; aspectClass: string; value: ImageState; onChange: (v: ImageState) => void; required?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange({ file, preview: URL.createObjectURL(file) });
  };
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#111111] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={`relative w-full ${aspectClass} rounded-2xl border-2 border-dashed border-[#E5E5EA] bg-[#F7F7F8] overflow-hidden group hover:border-[#cfe467] transition-colors cursor-pointer`}>
        <input type="file" accept="image/*" onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        {value.preview ? (
          <>
            <img src={value.preview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange({ file: null, preview: null }); }}
              className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition">
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6E6E73] group-hover:text-[#111111] transition-colors gap-2">
            <Upload size={22} className="opacity-50" />
            <p className="text-[13px] font-medium">Upload {label}</p>
            <p className="text-[11px] opacity-50">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ id, title, subtitle, action, children }: { id: string; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white rounded-[20px] border border-[#E5E5EA] scroll-mt-24 flex flex-col">
      <div className="px-6 py-4 border-b border-[#E5E5EA] rounded-t-[20px] flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#111111]">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#6E6E73] mt-1 leading-relaxed max-w-lg">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-6 flex flex-col gap-5 rounded-b-[20px]">{children}</div>
    </div>
  );
}

function FormInput({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <label className="text-[13px] font-semibold text-[#111111]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && (
          <div className="group relative flex items-center justify-center cursor-help">
            <Info size={13} className="text-[#9E9EA7] hover:text-[#111111] transition-colors" strokeWidth={2} />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-2.5 py-1.5 bg-[#111111] text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {hint}
            </span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-[#111111] placeholder:text-[#9E9EA7] focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all";

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("basic");

  const sectionIds = SECTIONS.map(s => s.id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionMap: Record<string, boolean> = {};

    sectionIds.forEach(id => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          sectionMap[id] = entry.isIntersecting;
          const first = sectionIds.find(sid => sectionMap[sid]);
          if (first) setActiveSection(first);
        },
        { rootMargin: "-20% 0px -40% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [hosts, setHosts] = useState<string[]>([]);
  const [tempHosts, setTempHosts] = useState<string[]>([]);
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [hostSearch, setHostSearch] = useState("");
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isUnlimitedCapacity, setIsUnlimitedCapacity] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('members')
        .select('id, name:full_name, avatar_url')
        .eq('org_id', user.id);

      if (data && !error) {
        setAvailableMembers(data as Member[]);
      }
    }
    fetchMembers();
  }, [supabase]);

  const [banner, setBanner] = useState<ImageState>({ file: null, preview: null });
  const [poster, setPoster] = useState<ImageState>({ file: null, preview: null });

  const [tags, setTags] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", tagline: "", description: "", category: "General",
    startDate: "", startTime: "", endDate: "", endTime: "",
    locationType: "physical",
    venue: "", locationLink: "", city: "",
    meetingLink: "", platform: "",
    price: "free", capacity: "", approvalRequired: "false", registrationDeadline: "", registrationEndTime: "",
    cancellationPolicy: "", refundPolicy: "", photographyPolicy: "",
    visibility: "public",
  });
  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const addTicket = () => setTickets(t => [...t, { id: Date.now().toString(), name: "", price: "", quantity: "", unlimited: false, qrCodeFile: null, qrCodePreview: null }]);
  const updateTicket = (id: string, key: keyof TicketType, val: string | boolean) =>
    setTickets(t => t.map(tt => tt.id === id ? { ...tt, [key]: val } : tt));
  const removeTicket = (id: string) => setTickets(t => t.filter(tt => tt.id !== id));

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const addCustomField = () => setCustomFields(f => [...f, { id: crypto.randomUUID(), label: "", type: "text", required: false, options: "" }]);
  const updateField = (id: string, key: keyof CustomField, val: any) =>
    setCustomFields(f => f.map(ff => ff.id === id ? { ...ff, [key]: val } : ff));
  const removeField = (id: string) => setCustomFields(f => f.filter(ff => ff.id !== id));

  const toggleHost = (memberId: string) => {
    setHosts(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const toggleTempHost = (memberId: string) => {
    setTempHosts(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const addSpeaker = () => setSpeakers(s => [...s, { id: crypto.randomUUID(), name: "", subtext: "", imageFile: null, imageUrl: "" }]);
  const updateSpeaker = (id: string, key: keyof Speaker, val: string) =>
    setSpeakers(s => s.map(ss => ss.id === id ? { ...ss, [key]: val } : ss));
  const removeSpeaker = (id: string) => setSpeakers(s => s.filter(ss => ss.id !== id));
  const handleSpeakerImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSpeakers(s => s.map(ss => ss.id === id ? { ...ss, imageFile: file, imageUrl: url } : ss));
    }
  };

  const uploadImage = async (state: ImageState, path: string) => {
    if (!state.file) return state.preview;
    const ext = state.file.name.split('.').pop();
    const fullPath = `${path}.${ext}`;
    const { error } = await supabase.storage.from('events').upload(fullPath, state.file, { upsert: true });
    if (error) {
      console.error("Image upload failed:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    const { data } = supabase.storage.from('events').getPublicUrl(fullPath);
    return data.publicUrl;
  };

  const handleSubmit = async (isDraft = false) => {
    if (isDraft) setSavingDraft(true); else setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const uid = crypto.randomUUID();
      if (!banner.file) throw new Error("A Banner image is required.");
      if (!poster.file) throw new Error("A Poster image is required.");

      const [bannerUrl, posterUrl] = await Promise.all([
        uploadImage(banner, `${user.id}/${uid}/banner`),
        uploadImage(poster, `${user.id}/${uid}/poster`),
      ]);

      const validFields = customFields.filter(f => f.label.trim());
      const singleTicketPrice = form.price === "paid" && tickets.length === 1 ? parseFloat(tickets[0].price) || 0 : null;

      if (form.price === "paid" && tickets.filter(t => t.name.trim()).length === 0) {
        throw new Error("You must add at least one ticket type for a paid event.");
      }

      if (hosts.length === 0) {
        throw new Error("You must select at least one host for the event.");
      }

      if (form.price === "paid") {
        if (!form.cancellationPolicy.trim() || !form.refundPolicy.trim()) {
          throw new Error("Cancellation and Refund policies are required for paid events.");
        }
        const missingQrCodes = tickets.filter(t => t.name.trim()).some(t => !t.qrCodeFile && !t.qrCodePreview);
        if (missingQrCodes) {
          throw new Error("Payment QR codes are required for all paid ticket types.");
        }
      }

      const uploadedSpeakers = await Promise.all(speakers.map(async (s) => {
        if (s.imageFile) {
          const url = await uploadImage({ file: s.imageFile, preview: null }, `${user.id}/${uid}/speakers/${s.id}`);
          return { id: s.id, name: s.name, subtext: s.subtext, imageUrl: url };
        }
        return { id: s.id, name: s.name, subtext: s.subtext, imageUrl: s.imageUrl };
      }));

      const uploadedTickets = await Promise.all(tickets.filter(t => t.name.trim()).map(async (t) => {
        let qrUrl = t.qrCodePreview;
        if (t.qrCodeFile) {
          qrUrl = await uploadImage({ file: t.qrCodeFile, preview: null }, `${user.id}/${uid}/tickets/${t.id}`);
        }
        return {
          id: t.id,
          name: t.name,
          price: parseFloat(t.price) || 0,
          quantity: t.unlimited ? null : (parseInt(t.quantity) || null),
          unlimited: t.unlimited,
          qr_code_url: qrUrl,
        };
      }));

      const { error: insertError } = await supabase.from("events").insert({
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        category: form.category,
        tags,
        hosts,
        speakers: uploadedSpeakers,
        image: bannerUrl,
        poster_image: posterUrl,
        date: form.startDate,
        time: form.startTime,
        end_date: form.endDate,
        end_time: form.endTime,
        venue: form.venue,
        location_link: form.locationLink,
        city: form.city,
        location_type: form.locationType,
        meeting_link: form.meetingLink,
        platform: form.platform,
        price: form.price,
        price_amount: singleTicketPrice,
        seats: isUnlimitedCapacity ? null : (parseInt(form.capacity) || null),
        seatsAvailable: isUnlimitedCapacity ? null : (parseInt(form.capacity) || null),
        approval_required: form.approvalRequired === "true",
        registration_deadline: form.registrationDeadline || null,
        registration_end_time: form.registrationEndTime || null,
        cancellation_policy: form.cancellationPolicy,
        refund_policy: form.refundPolicy,
        photography_policy: form.photographyPolicy,
        visibility: form.visibility,
        custom_fields: validFields,
        ticket_types: uploadedTickets,
        org_id: user.id,
        status: isDraft ? "draft" : "published",
        organizer: user.user_metadata?.full_name || user.email,
      });

      if (insertError) throw insertError;
      router.push("/dashboard/events");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
      setSavingDraft(false);
    }
  };

  return (
    <div className="flex gap-6 max-w-6xl mx-auto pb-20">
      {/* Sticky Section Nav */}
      <aside className="hidden lg:block w-52 shrink-0">
        <div className="sticky top-20 bg-white rounded-[20px] border border-[#E5E5EA] p-2 flex flex-col gap-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${activeSection === id ? "text-[#111111] shadow-sm" : "text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7]"
                }`}
              style={activeSection === id ? { background: "linear-gradient(135deg, #cfe467 0%, #c8de58 100%)" } : {}}
            >
              <Icon size={14} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* Form */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {/* Form Content */}

        {/* 1. Basic Info */}
        <div ref={el => { sectionRefs.current["basic"] = el; }} className="scroll-mt-24">
          <SectionCard id="basic" title="Basic Information">
            <FormInput label="Event Title" required>
              <input className={inputCls} placeholder="e.g. Annual Tech Hackathon 2026" value={form.title} onChange={e => set("title", e.target.value)} required />
            </FormInput>
            <FormInput label="Description" required>
              <textarea className={`${inputCls} resize-none`} rows={5} placeholder="Describe your event in detail…" value={form.description} onChange={e => set("description", e.target.value)} required />
            </FormInput>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Category">
                <CustomSelect options={CATEGORIES} value={form.category} onChange={v => set("category", v)} />
              </FormInput>
              <FormInput label="Tags" hint="Max 6 tags. Press Enter or comma to add.">
                <TagInput value={tags} onChange={setTags} />
              </FormInput>
            </div>
            <FormInput label="Visibility">
              <TabSwitcher
                options={[{ value: "public", label: "Public" }, { value: "unlisted", label: "Unlisted" }, { value: "private", label: "Private" }]}
                value={form.visibility}
                onChange={v => set("visibility", v)}
              />
            </FormInput>
          </SectionCard>
        </div>

        {/* 2. Cover Media */}
        <div ref={el => { sectionRefs.current["media"] = el; }} id="media" className="scroll-mt-24">
          <SectionCard id="media" title="Cover Media">
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-6 items-start">
              <ImageUploadZone label="Banner Image" hint="16:9 · 1920×1080 recommended" aspectClass="aspect-[16/9]" value={banner} onChange={setBanner} required />
              <ImageUploadZone label="Poster Image" hint="9:16 · Portrait recommended" aspectClass="aspect-[9/16]" value={poster} onChange={setPoster} required />
            </div>
          </SectionCard>
        </div>

        {/* 3. Date & Time */}
        <div ref={el => { sectionRefs.current["datetime"] = el; }} id="datetime" className="scroll-mt-24">
          <SectionCard id="datetime" title="Date & Time">
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Start Date" required>
                <Popover>
                  <PopoverTrigger className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-left focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all ${!form.startDate ? 'text-[#9E9EA7]' : 'text-[#111111]'}`}>
                    {form.startDate ? format(new Date(form.startDate + 'T12:00:00Z'), "MMM d, yyyy") : <span>Select date</span>}
                    <Calendar size={15} className="text-[#6E6E73]" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100] bg-white border border-[#E5E5EA] rounded-xl shadow-lg" align="end">
                    <CalendarUI mode="single" selected={form.startDate ? new Date(form.startDate + 'T12:00:00Z') : undefined} onSelect={(d) => set("startDate", d ? format(d, "yyyy-MM-dd") : "")} />
                  </PopoverContent>
                </Popover>
              </FormInput>
              <FormInput label="Start Time" required>
                <input type="time" className={inputCls} value={form.startTime} onChange={e => set("startTime", e.target.value)} required />
              </FormInput>
              <FormInput label="End Date">
                <Popover>
                  <PopoverTrigger className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-left focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all ${!form.endDate ? 'text-[#9E9EA7]' : 'text-[#111111]'}`}>
                    {form.endDate ? format(new Date(form.endDate + 'T12:00:00Z'), "MMM d, yyyy") : <span>Select date</span>}
                    <Calendar size={15} className="text-[#6E6E73]" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100] bg-white border border-[#E5E5EA] rounded-xl shadow-lg" align="end">
                    <CalendarUI mode="single" selected={form.endDate ? new Date(form.endDate + 'T12:00:00Z') : undefined} onSelect={(d) => set("endDate", d ? format(d, "yyyy-MM-dd") : "")} />
                  </PopoverContent>
                </Popover>
              </FormInput>
              <FormInput label="End Time">
                <input type="time" className={inputCls} value={form.endTime} onChange={e => set("endTime", e.target.value)} />
              </FormInput>
            </div>
          </SectionCard>
        </div>

        {/* 4. Location */}
        <div ref={el => { sectionRefs.current["location"] = el; }} id="location" className="scroll-mt-24">
          <SectionCard id="location" title="Location">
            <FormInput label="Event Type">
              <TabSwitcher
                options={[{ value: "physical", label: "In-Person" }, { value: "online", label: "Online" }, { value: "hybrid", label: "Hybrid" }]}
                value={form.locationType}
                onChange={v => set("locationType", v)}
              />
            </FormInput>

            {(form.locationType === "physical" || form.locationType === "hybrid") && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Venue Name" required>
                    <input className={inputCls} placeholder="e.g. Main Auditorium" value={form.venue} onChange={e => set("venue", e.target.value)} required />
                  </FormInput>
                  <FormInput label="City">
                    <input className={inputCls} placeholder="City" value={form.city} onChange={e => set("city", e.target.value)} />
                  </FormInput>
                </div>
                <FormInput label="Location Link" hint="Google Maps link or similar">
                  <input className={inputCls} placeholder="https://maps.google.com/..." value={form.locationLink} onChange={e => set("locationLink", e.target.value)} />
                </FormInput>
              </div>
            )}

            {(form.locationType === "online" || form.locationType === "hybrid") && (
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Meeting Link">
                  <input className={inputCls} placeholder="https://meet.google.com/…" value={form.meetingLink} onChange={e => set("meetingLink", e.target.value)} />
                </FormInput>
                <FormInput label="Platform">
                  <CustomSelect
                    options={["Google Meet", "Zoom", "Microsoft Teams", "Discord", "Other"]}
                    value={form.platform}
                    onChange={v => set("platform", v)}
                    placeholder="Select platform"
                  />
                </FormInput>
              </div>
            )}
          </SectionCard>
        </div>

        {/* 5. Registration */}
        <div ref={el => { sectionRefs.current["registration"] = el; }} id="registration" className="scroll-mt-24">
          <SectionCard id="registration" title="Registration & Tickets">
            <FormInput label="Ticket Type">
              <TabSwitcher
                options={[{ value: "free", label: "Free Event" }, { value: "paid", label: "Paid Event" }]}
                value={form.price}
                onChange={v => set("price", v)}
              />
            </FormInput>

            {form.price === "paid" && (
              <div className="rounded-[20px] bg-transparent border-2 border-dotted border-[#E5E5EA] p-5 flex flex-col gap-5 mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#111111]">Ticket Types</p>
                  <button type="button" onClick={addTicket} className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[#111111]">
                    <Plus size={12} strokeWidth={2.5} /> Add Ticket
                  </button>
                </div>
                {tickets.length === 0 && (
                  <p className="text-[12px] text-[#6E6E73] text-center py-3">Click "Add Ticket" to define ticket types.</p>
                )}
                {tickets.map((t, i) => (
                  <div key={t.id} className="bg-white rounded-[16px] border-2 border-dotted border-[#E5E5EA] p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 hover:border-[#D1D1D6] transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#6E6E73]">Ticket {i + 1}</span>
                      <button type="button" onClick={() => removeTicket(t.id)} className="text-[#6E6E73] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput label="Name">
                        <input className={inputCls} placeholder="General" value={t.name} onChange={e => updateTicket(t.id, "name", e.target.value)} />
                      </FormInput>
                      <FormInput label="Price (₹)">
                        <input type="number" min="0" className={inputCls} placeholder="500" value={t.price} onChange={e => updateTicket(t.id, "price", e.target.value.replace('-', ''))} />
                      </FormInput>
                    </div>
                    <div className="flex gap-4 items-start">
                      {form.price === "paid" && (
                        <div className="w-1/2">
                          <FormInput label="Payment QR Code" required>
                            {!t.qrCodePreview ? (
                              <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] hover:border-[#D1D1D6] transition-all cursor-pointer h-[46px]">
                                <Upload size={16} className="text-[#6E6E73]" />
                                <span className="text-[14px] font-medium text-[#111111]">Upload Payment QR</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const preview = URL.createObjectURL(file);
                                      const newTickets = tickets.map(ticket => ticket.id === t.id ? { ...ticket, qrCodeFile: file, qrCodePreview: preview } : ticket);
                                      setTickets(newTickets);
                                    }
                                  }}
                                />
                              </label>
                            ) : (
                              <div className="flex items-center justify-between w-full p-2.5 rounded-xl border border-[#E5E5EA] bg-white h-[46px]">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <img src={t.qrCodePreview} alt="QR" className="w-6 h-6 rounded object-cover shrink-0 border border-[#E5E5EA]" />
                                  <span className="text-[13px] font-medium text-[#111111] truncate max-w-[120px]" title={t.qrCodeFile?.name}>
                                    {t.qrCodeFile?.name || "QR Code"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-[#6E6E73] hover:text-[#111111]"
                                    onClick={() => window.open(t.qrCodePreview || "", "_blank")}
                                    title="Preview"
                                  >
                                    <Eye size={14} />
                                  </Button>
                                  <label className="flex items-center justify-center h-7 w-7 rounded-md text-[#6E6E73] hover:text-[#111111] hover:bg-accent cursor-pointer transition-colors" title="Replace">
                                    <RefreshCw size={14} />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const preview = URL.createObjectURL(file);
                                          const newTickets = tickets.map(ticket => ticket.id === t.id ? { ...ticket, qrCodeFile: file, qrCodePreview: preview } : ticket);
                                          setTickets(newTickets);
                                        }
                                      }}
                                    />
                                  </label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-[#6E6E73] hover:text-red-500"
                                    onClick={() => {
                                      const newTickets = tickets.map(ticket => ticket.id === t.id ? { ...ticket, qrCodeFile: null, qrCodePreview: null } : ticket);
                                      setTickets(newTickets);
                                    }}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </FormInput>
                        </div>
                      )}
                      <div className="flex-1">
                        <FormInput label="Quantity">
                          <div className={`flex items-center px-4 py-2.5 rounded-xl border transition-all ${t.unlimited ? 'bg-[#F5F5F7] border-[#E5E5EA]' : 'bg-white border-[#E5E5EA] focus-within:border-[#cfe467] focus-within:ring-2 focus-within:ring-[#cfe467]/20'}`}>
                            <input
                              type="number"
                              min="0"
                              disabled={t.unlimited}
                              className="flex-1 w-full bg-transparent text-[14px] text-[#111111] placeholder:text-[#9E9EA7] outline-none disabled:opacity-50"
                              placeholder="e.g. 100"
                              value={t.quantity}
                              onChange={e => updateTicket(t.id, "quantity", e.target.value.replace('-', ''))}
                            />
                            <div className="w-px h-5 bg-[#E5E5EA] mx-3 shrink-0" />
                            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
                                checked={t.unlimited}
                                onChange={e => {
                                  updateTicket(t.id, "unlimited", e.target.checked);
                                  if (e.target.checked) updateTicket(t.id, "quantity", "");
                                }}
                              />
                              <span className="text-[13px] font-semibold text-[#6E6E73]">Unlimited</span>
                            </label>
                          </div>
                        </FormInput>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Registration Deadline" required>
                <Popover>
                  <PopoverTrigger className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-left focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all ${!form.registrationDeadline ? 'text-[#9E9EA7]' : 'text-[#111111]'}`}>
                    {form.registrationDeadline ? format(new Date(form.registrationDeadline + 'T12:00:00Z'), "MMM d, yyyy") : <span>Select date</span>}
                    <Calendar size={15} className="text-[#6E6E73]" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100] bg-white border border-[#E5E5EA] rounded-xl shadow-lg" align="end">
                    <CalendarUI mode="single" selected={form.registrationDeadline ? new Date(form.registrationDeadline + 'T12:00:00Z') : undefined} onSelect={(d) => set("registrationDeadline", d ? format(d, "yyyy-MM-dd") : "")} />
                  </PopoverContent>
                </Popover>
              </FormInput>

              <FormInput label="Registration Time" required>
                <div className="relative">
                  <input type="time" className={inputCls} value={form.registrationEndTime} onChange={e => set("registrationEndTime", e.target.value)} />
                  <Clock size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6E73] pointer-events-none" />
                </div>
              </FormInput>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <FormInput label="Approval Mode">
                <TabSwitcher
                  options={[{ value: "false", label: "Auto-Approve" }, { value: "true", label: "Manual Approval" }]}
                  value={form.approvalRequired}
                  onChange={v => set("approvalRequired", v)}
                />
              </FormInput>

              <FormInput label="Max Capacity">
                <div className={`flex items-center px-4 py-2.5 rounded-xl border transition-all ${isUnlimitedCapacity ? 'bg-[#F5F5F7] border-[#E5E5EA]' : 'bg-white border-[#E5E5EA] focus-within:border-[#cfe467] focus-within:ring-2 focus-within:ring-[#cfe467]/20'}`}>
                  <input
                    type="number"
                    min="0"
                    disabled={isUnlimitedCapacity}
                    className="flex-1 w-full bg-transparent text-[14px] text-[#111111] placeholder:text-[#9E9EA7] outline-none disabled:opacity-50"
                    placeholder="e.g. 200"
                    value={form.capacity}
                    onChange={e => set("capacity", e.target.value.replace('-', ''))}
                  />
                  <div className="w-px h-5 bg-[#E5E5EA] mx-3 shrink-0" />
                  <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
                      checked={isUnlimitedCapacity}
                      onChange={e => {
                        setIsUnlimitedCapacity(e.target.checked);
                        if (e.target.checked) set("capacity", "");
                      }}
                    />
                    <span className="text-[13px] font-semibold text-[#6E6E73]">Unlimited</span>
                  </label>
                </div>
              </FormInput>
            </div>

          </SectionCard>
        </div>

        {/* 6. Custom Fields */}
        <div ref={el => { sectionRefs.current["custom_fields"] = el; }} id="custom_fields" className="scroll-mt-24">
          <SectionCard
            id="custom_fields"
            title="Custom Registration Fields"
            subtitle="Leave empty for one-slide registration."
            action={
              <button type="button" onClick={addCustomField} className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[#111111]">
                <Plus size={12} strokeWidth={2.5} /> Add Field
              </button>
            }
          >
            <div className="flex flex-col gap-5">

              <div className="flex flex-col gap-4">
                {customFields.map((field, i) => (
                  <div key={field.id} className="bg-white rounded-[16px] border-2 border-dotted border-[#E5E5EA] p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 hover:border-[#D1D1D6] transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#6E6E73]">Field {i + 1}</span>
                      <button type="button" onClick={() => removeField(field.id)} className="text-[#6E6E73] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput label="Label">
                        <input className={inputCls} placeholder="e.g. Roll Number" value={field.label} onChange={e => updateField(field.id, "label", e.target.value)} />
                      </FormInput>
                      <FormInput label="Field Type">
                        <CustomSelect
                          options={FIELD_TYPES}
                          value={field.type}
                          onChange={v => updateField(field.id, "type", v)}
                        />
                      </FormInput>
                    </div>
                    {field.type === "select" && (
                      <FormInput label="Options (comma separated)">
                        <input className={inputCls} placeholder="Option A, Option B, Option C" value={field.options} onChange={e => updateField(field.id, "options", e.target.value)} />
                      </FormInput>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, "required", e.target.checked)} className="w-4 h-4 accent-[#111111] rounded" />
                      <span className="text-[13px] text-[#111111]">Required field</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* 6.5 Hosts & Speakers */}
        <div ref={el => { sectionRefs.current["hosts_speakers"] = el; }} id="hosts_speakers" className="scroll-mt-24">
          <SectionCard
            id="hosts_speakers"
            title="Hosts & Speakers"
            subtitle="Select members to host this event, and add external speakers."
          >
            <div className="flex flex-col gap-6">

              {/* Hosts */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#111111]">Hosts</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTempHosts([...hosts]);
                      setHostModalOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[#111111]"
                  >
                    <Plus size={12} strokeWidth={2.5} /> Add Host
                  </button>
                </div>

                {hosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {availableMembers.filter(m => hosts.includes(m.id)).map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E5EA] bg-white">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-xs font-bold text-[#6E6E73] border border-[#E5E5EA]">
                              {member.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[14px] text-[#111111] font-medium">{member.name}</span>
                        </div>
                        <button type="button" onClick={() => toggleHost(member.id)} className="text-[#6E6E73] hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] text-center">
                    <p className="text-[12px] text-[#6E6E73]">No hosts added. Click "Add Host" to select members.</p>
                  </div>
                )}
              </div>

              {/* Speakers */}
              <div className="pt-4 border-t border-[#E5E5EA] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#111111]">External Speakers</p>
                  <button type="button" onClick={addSpeaker} className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[#111111]">
                    <Plus size={12} strokeWidth={2.5} /> Add Speaker
                  </button>
                </div>
                {speakers.length === 0 && (
                  <p className="text-[12px] text-[#6E6E73] text-center py-2">No external speakers added yet.</p>
                )}
                {speakers.map((s, i) => (
                  <div key={s.id} className="bg-white rounded-[16px] border-2 border-dotted border-[#E5E5EA] p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 hover:border-[#D1D1D6] transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#6E6E73]">Speaker {i + 1}</span>
                      <button type="button" onClick={() => removeSpeaker(s.id)} className="text-[#6E6E73] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      <div className="shrink-0 flex flex-col gap-2">
                        <label className="relative w-20 h-20 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center cursor-pointer overflow-hidden hover:bg-[#EBEBEF] transition-colors group mx-auto sm:mx-0">
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleSpeakerImage(s.id, e)} />
                          {s.imageUrl ? (
                            <img src={s.imageUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={24} className="text-[#9E9EA7]" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={18} className="text-white" />
                          </div>
                        </label>
                      </div>

                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput label="Name">
                          <input className={inputCls} placeholder="e.g. Jane Doe" value={s.name} onChange={e => updateSpeaker(s.id, "name", e.target.value)} />
                        </FormInput>
                        <FormInput label="Role / Subtext">
                          <input className={inputCls} placeholder="e.g. Keynote Speaker" value={s.subtext} onChange={e => updateSpeaker(s.id, "subtext", e.target.value)} />
                        </FormInput>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </SectionCard>
        </div>

        {/* 7. Policies */}
        <div ref={el => { sectionRefs.current["policies"] = el; }} id="policies" className="scroll-mt-24">
          <SectionCard id="policies" title="Policies">
            <FormInput label="Cancellation Policy" required={form.price === "paid"}>
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Describe your cancellation policy…" value={form.cancellationPolicy} onChange={e => set("cancellationPolicy", e.target.value)} />
            </FormInput>
            <FormInput label="Refund Policy" required={form.price === "paid"}>
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Describe your refund policy…" value={form.refundPolicy} onChange={e => set("refundPolicy", e.target.value)} />
            </FormInput>
            <FormInput label="Photography Policy">
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="e.g. Photography allowed for personal use only." value={form.photographyPolicy} onChange={e => set("photographyPolicy", e.target.value)} />
            </FormInput>
          </SectionCard>
        </div>

        {/* Actions */}
        {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-medium">{error}</div>}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={savingDraft || loading}
            className="px-6 py-3 rounded-xl text-[14px] font-semibold text-[#6E6E73] bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] hover:text-[#111111] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {savingDraft ? <Loader2 size={15} className="animate-spin" /> : null}
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading || savingDraft}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-[14px] font-semibold text-[#111111] transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:hover:scale-100 disabled:active:scale-100"
            style={{
              background: "#cfe467",
              boxShadow: "0 4px 20px rgba(207,228,103,0.35)",
            }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Publishing…</> : "Publish Event"}
          </button>
        </div>
      </div>

      {/* Host Modal */}
      {hostModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTempHosts([]);
              setHostModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-[20px] w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-[18px] font-bold text-[#111111]">Select Hosts</h3>
              <button
                type="button"
                onClick={() => {
                  setTempHosts([]);
                  setHostModalOpen(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#111111] transition-all -mt-1 -mr-1 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[14px] text-[#6E6E73] mb-4">
              Choose members from your organisation to host this event.
            </p>

            <div className="relative mb-4 shrink-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7]" />
              <input
                type="text"
                placeholder="Search members by name..."
                value={hostSearch}
                onChange={e => setHostSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F7] border border-transparent rounded-[12px] text-[14px] text-[#111111] placeholder:text-[#9E9EA7] outline-none focus:bg-white focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 mb-6 pr-2">
              <div className="flex flex-col gap-2">
                {availableMembers
                  .filter(m => m.name.toLowerCase().includes(hostSearch.toLowerCase()))
                  .map(member => {
                    const isSelected = tempHosts.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => toggleTempHost(member.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#cfe467] bg-[#cfe467]/10' : 'border-[#E5E5EA] bg-white hover:border-[#D1D1D6]'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[13px] font-bold text-[#6E6E73] border border-[#E5E5EA]">
                              {member.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[14px] text-[#111111] font-bold">{member.name}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isSelected ? 'border-[#cfe467] bg-[#cfe467] text-[#111111]' : 'border-[#D1D1D6] bg-white text-transparent'
                          }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                {availableMembers.filter(m => m.name.toLowerCase().includes(hostSearch.toLowerCase())).length === 0 && (
                  <p className="text-[12px] text-[#6E6E73] p-4 bg-[#F9F9FB] rounded-xl border border-[#E5E5EA] text-center">
                    {availableMembers.length === 0 ? "No members found in your organisation." : "No members match your search."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 shrink-0 pt-4 border-t border-[#E5E5EA]">
              <button
                onClick={() => {
                  setTempHosts([]);
                  setHostModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-[10px] text-[14px] font-semibold text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setHosts([...tempHosts]);
                  setHostModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-[10px] text-[14px] font-semibold text-[#111111] bg-[#cfe467] hover:opacity-90 transition-opacity"
              >
                Save Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
