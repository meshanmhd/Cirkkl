"use client";

import { useState, useRef, useEffect } from "react";
import {
  User, Activity, Users, Mail, Phone, Edit2, X, MapPin, Link as LinkIcon, Camera, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { createClient } from "@/utils/supabase/client";
import { DotQRCode } from "@/components/ui/DotQRCode";
import { CountryDropdown, StateDropdown } from "@/components/ui/country-dropdown";
import { PhoneInput } from "@/components/ui/phone-input";
import { CollegeDropdown } from "@/components/ui/college-dropdown";
import { Country, State } from "country-state-city";
import { isValidPhoneNumber } from "libphonenumber-js";

const SECTIONS = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "activity", label: "Activities", icon: Activity },
  { id: "clubs", label: "My Clubs", icon: Users },
];

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
}

function SectionCard({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#E5E5EA]">
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

function FieldRow({ label, value, placeholder }: { label: string; value?: string | null; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12px] font-semibold text-[#6E6E73]">{label}</p>
      <p className="text-[14px] font-medium text-[#111111]">
        {value || <span className="text-[#9E9EA7] italic">{placeholder ?? "Not set"}</span>}
      </p>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">{children}</div>;
}

function GroupDivider({ label }: { label: string }) {
  return <h3 className="text-[13px] font-bold text-[#111111] border-b border-[#E5E5EA] pb-2 mb-1">{label}</h3>;
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E5EA] text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all"
    >
      <Edit2 size={12} />
      Edit
    </button>
  );
}

function EditModal({ open, onClose, title, children, onSave, saving, disabled }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; onSave: () => void; saving: boolean; disabled?: boolean;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] border border-[#E5E5EA] w-full max-w-lg mx-4 shadow-[0_20px_60px_rgba(0,0,0,0.14)]">
        <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#111111]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#6E6E73] hover:bg-[#F5F5F7] transition-all">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
            {children}
          </div>
          <div className="px-6 py-4 border-t border-[#E5E5EA] flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#F5F5F7] text-[#111111] hover:bg-[#E5E5EA] font-semibold h-11 px-5 shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || disabled}
              className="rounded-xl bg-[#cfe467] text-[#111111] hover:bg-[#b8cc58] font-semibold h-11 px-5 disabled:opacity-50 shadow-none"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, required, min, max, list }: {
  label: React.ReactNode; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; max?: string; list?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#111111]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={e => {
          if (type === "number" && max && e.target.value.length > max.length) {
            e.target.value = e.target.value.slice(0, max.length);
          }
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        list={list}
        className="h-12 px-4 rounded-xl border-[#E5E5EA] shadow-none focus-visible:ring-0 focus-visible:border-[#9E9EA7]"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }: {
  label: React.ReactNode; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#111111]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <ShadcnSelect value={value || "unspecified"} onValueChange={(v) => onChange(v === "unspecified" ? "" : v)} required={required}>
        <SelectTrigger className="h-12 px-4 rounded-xl border-[#E5E5EA] shadow-none focus:ring-0 focus:border-[#9E9EA7] bg-white text-sm text-[#111111]">
          <SelectValue placeholder="Not specified" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-[#E5E5EA]">
          <SelectItem value="unspecified" className="text-muted-foreground focus:bg-[#F5F5F7]">Not specified</SelectItem>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value} className="focus:bg-[#F5F5F7]">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, required }: {
  label: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#111111]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={3}
        className="px-4 py-3 rounded-xl border border-[#E5E5EA] bg-transparent text-sm text-[#111111] placeholder:text-muted-foreground focus:outline-none focus:border-[#9E9EA7] transition-colors resize-none"
      />
    </div>
  );
}

export function ProfilePage({ profile: initialProfile }: { profile: any }) {
  const supabase = createClient();
  const [profile, setProfile] = useState(initialProfile ?? {});
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);

  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [academicsEditOpen, setAcademicsEditOpen] = useState(false);
  const [contactEditOpen, setContactEditOpen] = useState(false);

  const [profileDraft, setProfileDraft] = useState<any>({});
  const [academicsDraft, setAcademicsDraft] = useState<any>({});
  const [contactDraft, setContactDraft] = useState<any>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  function openProfileEdit() {
    setProfileDraft({
      full_name: profile.full_name ?? "",
      bio: profile.bio ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      gender: profile.gender ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      country: profile.country ?? "",
      pincode: profile.pincode ?? "",
    });
    setProfileEditOpen(true);
  }

  function openAcademicsEdit() {
    setAcademicsDraft({
      college_name: profile.college_name ?? "",
      department: profile.department ?? "",
      semester: profile.semester ?? "",
      admission_year: profile.admission_year ?? "",
      graduation_year: profile.graduation_year ?? "",
    });
    setAcademicsEditOpen(true);
  }

  function openContactEdit() {
    setContactDraft({
      phone: profile.phone ?? "",
      alternate_email: profile.alternate_email ?? "",
      whatsapp: profile.whatsapp ?? "",
      linkedin: profile.linkedin ?? "",
      github: profile.github ?? "",
    });
    setContactEditOpen(true);
  }

  async function saveSection(draft: any, setOpen: (v: boolean) => void) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data } = await supabase.from("profiles").update(draft).eq("id", user.id).select().single();
    if (data) setProfile((p: any) => ({ ...p, ...data }));
    setOpen(false);
    setSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAvatarUploading(false); return; }
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("profiles").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("profiles").getPublicUrl(path);
      const { data } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id).select().single();
      if (data) setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
    }
    setAvatarUploading(false);
  }

  const resolvedCountry = profile.country ? (Country.getCountryByCode(profile.country)?.name || profile.country) : null;
  const resolvedState = profile.state && profile.country ? (State.getStateByCodeAndCountry(profile.state, profile.country)?.name || profile.state) : profile.state;
  const location = [profile.city, resolvedState, resolvedCountry].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col">
      <div className="flex flex-1 gap-6 max-w-7xl mx-auto w-full px-6 py-8 items-start">

        {/* ─── LEFT 30%: sticky identity + nav ─── */}
        <aside className="hidden lg:flex flex-col gap-4 w-[30%] shrink-0 sticky top-8">

          {/* Identity card — circle avatar, name, CKL ID, Edit */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-6">
            <div className="flex items-center gap-4">
              {/* Circle avatar — no camera overlay */}
              <Avatar className="w-[56px] h-[56px] rounded-full border-2 border-[#E5E5EA] shrink-0">
                <AvatarImage
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.id}`}
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#F5F5F7] text-[#111111] font-bold text-base rounded-full">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* Name + CKL ID */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[#111111] truncate">{profile.full_name || "Your Name"}</p>
                {profile.qr_id && (
                  <p className="text-[12px] font-mono text-[#6E6E73] mt-0.5 truncate">{profile.qr_id}</p>
                )}
                {location && (
                  <p className="text-[11px] text-[#9E9EA7] mt-0.5 flex items-center gap-1 truncate">
                    <MapPin size={10} />
                    {location}
                  </p>
                )}
              </div>

              {/* Edit button */}
              <button
                onClick={openProfileEdit}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-[#E5E5EA] text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F7] transition-all"
              >
                <Edit2 size={11} />
                Edit
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-2 flex flex-col gap-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left ${activeSection === id ? "text-[#111111] shadow-sm" : "text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7]"}`}
                style={activeSection === id ? { background: "linear-gradient(135deg, #cfe467 0%, #c8de58 100%)" } : {}}
              >
                <Icon size={14} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* ─── RIGHT 70%: content ─── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 pb-20">

          {/* ── My Profile ── */}
          {activeSection === "profile" && (
            <>
              {/* Basic Profile */}
              <SectionCard title="Basic Profile" subtitle="Personal information" action={<EditBtn onClick={openProfileEdit} />}>
                <TwoCol>
                  <FieldRow label="Full Name" value={profile.full_name} />
                  <FieldRow label="Gender" value={profile.gender} />
                  <FieldRow label="Date of Birth" value={profile.date_of_birth} />
                </TwoCol>
                <FieldRow label="Short Bio" value={profile.bio} placeholder="Tell people a bit about yourself" />
                <GroupDivider label="Location" />
                <TwoCol>
                  <FieldRow label="City" value={profile.city} />
                  <FieldRow label="State" value={profile.state} />
                  <FieldRow label="Country" value={profile.country} />
                </TwoCol>
              </SectionCard>

              {/* Academics */}
              <SectionCard title="Academics" subtitle="College and course information" action={<EditBtn onClick={openAcademicsEdit} />}>
                <FieldRow label="College / University" value={profile.college_name} />
                <TwoCol>
                  <FieldRow label="Department" value={profile.department} />
                  <FieldRow label="Current Semester" value={profile.semester} />
                  <FieldRow label="Admission Year" value={profile.admission_year} />
                  <FieldRow label="Expected Graduation Year" value={profile.graduation_year} />
                </TwoCol>
              </SectionCard>

              {/* Contact & Links */}
              <SectionCard title="Contact & Links" subtitle="How people can reach you" action={<EditBtn onClick={openContactEdit} />}>
                <GroupDivider label="Primary" />
                <TwoCol>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] border border-[#E5E5EA] bg-[#F7F7F8] flex items-center justify-center shrink-0">
                      <Mail size={13} className="text-[#6E6E73]" />
                    </div>
                    <FieldRow label="Email" value={profile.email} type="email" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] border border-[#E5E5EA] bg-[#F7F7F8] flex items-center justify-center shrink-0">
                      <Phone size={15} className="text-[#6E6E73]" />
                    </div>
                    <FieldRow label="Phone Number" value={profile.phone} type="phone" />
                  </div>
                </TwoCol>

                <GroupDivider label="Optional" />
                <TwoCol>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] border border-[#E5E5EA] bg-[#F7F7F8] flex items-center justify-center shrink-0">
                      <Mail size={13} className="text-[#6E6E73]" />
                    </div>
                    <FieldRow label="Alternate Email" value={profile.alternate_email} placeholder="Optional" type="email" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] border border-[#E5E5EA] bg-[#F7F7F8] flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 32 32" className="text-[#25D366] fill-current">
                        <path d="M25.873,6.069c-2.619-2.623-6.103-4.067-9.814-4.069C8.411,2,2.186,8.224,2.184,15.874c-.001,2.446,.638,4.833,1.852,6.936l-1.969,7.19,7.355-1.929c2.026,1.106,4.308,1.688,6.63,1.689h.006c7.647,0,13.872-6.224,13.874-13.874,.001-3.708-1.44-7.193-4.06-9.815h0Zm-9.814,21.347h-.005c-2.069,0-4.099-.557-5.87-1.607l-.421-.25-4.365,1.145,1.165-4.256-.274-.436c-1.154-1.836-1.764-3.958-1.763-6.137,.003-6.358,5.176-11.531,11.537-11.531,3.08,.001,5.975,1.202,8.153,3.382,2.177,2.179,3.376,5.077,3.374,8.158-.003,6.359-5.176,11.532-11.532,11.532h0Zm6.325-8.636c-.347-.174-2.051-1.012-2.369-1.128-.318-.116-.549-.174-.78,.174-.231,.347-.895,1.128-1.098,1.359-.202,.232-.405,.26-.751,.086-.347-.174-1.464-.54-2.788-1.72-1.03-.919-1.726-2.054-1.929-2.402-.202-.347-.021-.535,.152-.707,.156-.156,.347-.405,.52-.607,.174-.202,.231-.347,.347-.578,.116-.232,.058-.434-.029-.607-.087-.174-.78-1.88-1.069-2.574-.281-.676-.567-.584-.78-.595-.202-.01-.433-.012-.665-.012s-.607,.086-.925,.434c-.318,.347-1.213,1.186-1.213,2.892s1.242,3.355,1.416,3.587c.174,.232,2.445,3.733,5.922,5.235,.827,.357,1.473,.571,1.977,.73,.83,.264,1.586,.227,2.183,.138,.666-.1,2.051-.839,2.34-1.649,.289-.81,.289-1.504,.202-1.649s-.318-.232-.665-.405h0Z" fillRule="evenodd"></path>
                      </svg>
                    </div>
                    <FieldRow label="WhatsApp" value={profile.whatsapp} placeholder="Optional" type="phone" />
                  </div>
                </TwoCol>

                <GroupDivider label="Social Links" />
                <div className="flex flex-col gap-4">
                  {[
                    { 
                      key: "linkedin", 
                      label: "LinkedIn", 
                      color: "#0A66C2",
                      icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" className="fill-current"><path d="M26.111,3H5.889c-1.595,0-2.889,1.293-2.889,2.889V26.111c0,1.595,1.293,2.889,2.889,2.889H26.111c1.595,0,2.889-1.293,2.889-2.889V5.889c0-1.595-1.293-2.889-2.889-2.889ZM10.861,25.389h-3.877V12.87h3.877v12.519Zm-1.957-14.158c-1.267,0-2.293-1.034-2.293-2.31s1.026-2.31,2.293-2.31,2.292,1.034,2.292,2.31-1.026,2.31-2.292,2.31Zm16.485,14.158h-3.858v-6.571c0-1.802-.685-2.809-2.111-2.809-1.551,0-2.362,1.048-2.362,2.809v6.571h-3.718V12.87h3.718v1.686s1.118-2.069,3.775-2.069,4.556,1.621,4.556,4.975v7.926Z" fillRule="evenodd"></path></svg>
                    },
                    { 
                      key: "github", 
                      label: "GitHub", 
                      color: "#111111",
                      icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" className="fill-current"><path d="M16,2.345c7.735,0,14,6.265,14,14-.002,6.015-3.839,11.359-9.537,13.282-.7,.14-.963-.298-.963-.665,0-.473,.018-1.978,.018-3.85,0-1.312-.437-2.152-.945-2.59,3.115-.35,6.388-1.54,6.388-6.912,0-1.54-.543-2.783-1.435-3.762,.14-.35,.63-1.785-.14-3.71,0,0-1.173-.385-3.85,1.435-1.12-.315-2.31-.472-3.5-.472s-2.38,.157-3.5,.472c-2.677-1.802-3.85-1.435-3.85-1.435-.77,1.925-.28,3.36-.14,3.71-.892,.98-1.435,2.24-1.435,3.762,0,5.355,3.255,6.563,6.37,6.913-.403,.35-.77,.963-.893,1.872-.805,.368-2.818,.963-4.077-1.155-.263-.42-1.05-1.452-2.152-1.435-1.173,.018-.472,.665,.017,.927,.595,.332,1.277,1.575,1.435,1.978,.28,.787,1.19,2.293,4.707,1.645,0,1.173,.018,2.275,.018,2.607,0,.368-.263,.787-.963,.665-5.719-1.904-9.576-7.255-9.573-13.283,0-7.735,6.265-14,14-14Z"></path></svg>
                    },
                  ].map(({ key, label, icon, color }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] border border-[#E5E5EA] bg-[#F7F7F8] flex items-center justify-center shrink-0" style={{ color }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#6E6E73]">{label}</p>
                        {profile[key]
                          ? <a href={profile[key]} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[#111111] hover:text-[#cfe467] transition-colors truncate flex items-center gap-1">
                              <LinkIcon size={11} />
                              {profile[key].replace(/^https?:\/\/(www\.)?/, "")}
                            </a>
                          : <p className="text-[13px] italic text-[#9E9EA7]">Not added</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Activities ── */}
          {activeSection === "activity" && (
            <SectionCard title="Activities" subtitle="Events you've registered for or attended">
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-12 h-12 rounded-[14px] bg-[#F5F5F7] flex items-center justify-center">
                  <Activity size={20} className="text-[#9E9EA7]" />
                </div>
                <p className="text-[14px] font-semibold text-[#111111]">No activity yet</p>
                <p className="text-[12px] text-[#6E6E73] max-w-xs">Events you register for or attend will appear here.</p>
              </div>
            </SectionCard>
          )}

          {/* ── My Clubs ── */}
          {activeSection === "clubs" && (
            <SectionCard title="My Clubs" subtitle="Clubs and organisations you are part of">
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-12 h-12 rounded-[14px] bg-[#F5F5F7] flex items-center justify-center">
                  <Users size={20} className="text-[#9E9EA7]" />
                </div>
                <p className="text-[14px] font-semibold text-[#111111]">Not in any clubs yet</p>
                <p className="text-[12px] text-[#6E6E73] max-w-xs">Clubs you join will be listed here.</p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* ── Edit: Basic Profile (includes avatar upload) ── */}
      <EditModal 
        open={profileEditOpen} 
        onClose={() => setProfileEditOpen(false)} 
        title="Edit Basic Profile" 
        onSave={() => saveSection(profileDraft, setProfileEditOpen)} 
        saving={saving}
        disabled={!profileDraft.full_name || !profileDraft.date_of_birth || !profileDraft.gender || !profileDraft.country || !profileDraft.state || !profileDraft.city || !profileDraft.pincode}
      >
        {/* Avatar upload — only inside edit modal */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <div className="relative">
            <Avatar className="w-20 h-20 rounded-full border-2 border-[#E5E5EA]">
              <AvatarImage
                src={profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.id}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-[#F5F5F7] text-[#111111] font-bold text-xl rounded-full">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center text-[#6E6E73] hover:text-[#111111] hover:border-[#cfe467] transition-all shadow-sm"
            >
              {avatarUploading
                ? <span className="w-3 h-3 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                : <Camera size={12} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="text-[12px] text-[#6E6E73]">Click the camera icon to change photo</p>
        </div>

        <InputField label="Full Name" required value={profileDraft.full_name ?? ""} onChange={v => setProfileDraft((d: any) => ({ ...d, full_name: v }))} placeholder="Your full name" />
        <TextareaField label={<span>Short Bio <span className="text-[#9E9EA7] font-normal">(Optional)</span></span>} value={profileDraft.bio ?? ""} onChange={v => setProfileDraft((d: any) => ({ ...d, bio: v }))} placeholder="A short sentence about yourself..." />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111111]">Date of Birth <span className="text-red-500">*</span></label>
            <Popover>
              <PopoverTrigger className={`h-12 w-full flex items-center justify-between px-4 rounded-xl border border-[#E5E5EA] bg-white text-sm text-left focus:outline-none focus:border-[#9E9EA7] focus:ring-0 shadow-none transition-all ${!profileDraft.date_of_birth ? 'text-[#9E9EA7]' : 'text-[#111111]'}`}>
                {profileDraft.date_of_birth ? format(new Date(profileDraft.date_of_birth + 'T12:00:00Z'), "MMM d, yyyy") : <span>Select date</span>}
                <Calendar size={15} className="text-[#6E6E73]" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100] bg-white border border-[#E5E5EA] rounded-xl shadow-lg" align="start">
                <CalendarUI mode="single" selected={profileDraft.date_of_birth ? new Date(profileDraft.date_of_birth + 'T12:00:00Z') : undefined} onSelect={(d) => setProfileDraft((draft: any) => ({ ...draft, date_of_birth: d ? format(d, "yyyy-MM-dd") : "" }))} />
              </PopoverContent>
            </Popover>
          </div>
          <SelectField
            required
            label="Gender" value={profileDraft.gender ?? ""} onChange={v => setProfileDraft((d: any) => ({ ...d, gender: v }))}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Non-binary", label: "Non-binary" },
              { value: "Prefer not to say", label: "Prefer not to say" },
            ]}
          />
        </div>
        <p className="text-[12px] font-bold text-[#6E6E73] uppercase tracking-widest mt-1">Location</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111111]">Country <span className="text-red-500">*</span></label>
            <CountryDropdown
              value={profileDraft.country || "IN"}
              onChange={v => setProfileDraft((d: any) => ({ ...d, country: v, state: "" }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111111]">State <span className="text-red-500">*</span></label>
            <StateDropdown
              countryCode={profileDraft.country || "IN"}
              value={profileDraft.state ?? ""}
              onChange={v => setProfileDraft((d: any) => ({ ...d, state: v }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <InputField label="City" required value={profileDraft.city ?? ""} onChange={v => setProfileDraft((d: any) => ({ ...d, city: v }))} placeholder="City" />
          <InputField label="Pincode" type="number" required value={profileDraft.pincode ?? ""} onChange={v => setProfileDraft((d: any) => ({ ...d, pincode: v }))} placeholder="Pincode" />
        </div>
      </EditModal>

      {/* ── Edit: Academics ── */}
      <EditModal 
        open={academicsEditOpen} 
        onClose={() => setAcademicsEditOpen(false)} 
        title="Edit Academics" 
        onSave={() => saveSection(academicsDraft, setAcademicsEditOpen)} 
        saving={saving}
        disabled={!academicsDraft.college_name || !academicsDraft.department || !academicsDraft.semester || !academicsDraft.admission_year || !academicsDraft.graduation_year}
      >
        <CollegeDropdown 
          required
          value={academicsDraft.college_name ?? ""} 
          onChange={v => setAcademicsDraft((d: any) => ({ ...d, college_name: v }))} 
        />
        <InputField required label="Department" value={academicsDraft.department ?? ""} onChange={v => setAcademicsDraft((d: any) => ({ ...d, department: v }))} placeholder="e.g. Computer Science" />
        <div className="grid grid-cols-3 gap-3">
          <SelectField
            required
            label="Semester" value={academicsDraft.semester ?? ""} onChange={v => setAcademicsDraft((d: any) => ({ ...d, semester: v }))}
            options={Array.from({length: 8}, (_, i) => ({ value: String(i+1), label: `Semester ${i+1}` }))}
          />
          <InputField required label="Admission Year" type="number" min="1950" max="2100" value={academicsDraft.admission_year ?? ""} onChange={v => setAcademicsDraft((d: any) => ({ ...d, admission_year: v }))} placeholder="e.g. 2022" />
          <InputField required label="Graduation Year" type="number" min="1950" max="2100" value={academicsDraft.graduation_year ?? ""} onChange={v => setAcademicsDraft((d: any) => ({ ...d, graduation_year: v }))} placeholder="e.g. 2026" />
        </div>
      </EditModal>

      {/* ── Edit: Contact & Links ── */}
      <EditModal 
        open={contactEditOpen} 
        onClose={() => setContactEditOpen(false)} 
        title="Edit Contact & Links" 
        onSave={() => saveSection(contactDraft, setContactEditOpen)} 
        saving={saving}
        disabled={(() => {
          const checkPhoneValid = (val: string | undefined | null, required: boolean) => {
            if (!val) return !required;
            const cleaned = val.replace(/[\s-]/g, "");
            if (cleaned === "" || cleaned === "+") return !required;
            if (/^\+\d{1,4}$/.test(cleaned)) return !required;
            try {
              return isValidPhoneNumber(cleaned, "IN" as any);
            } catch {
              return false;
            }
          };
          return !checkPhoneValid(contactDraft.phone, true) || !checkPhoneValid(contactDraft.whatsapp, false);
        })()}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111111]">Phone Number <span className="text-red-500">*</span></label>
            <PhoneInput required value={contactDraft.phone ?? ""} onChange={v => setContactDraft((d: any) => ({ ...d, phone: v }))} placeholder="+91 00000 00000" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#111111]">WhatsApp <span className="text-[#9E9EA7] font-normal">(Optional)</span></label>
            <PhoneInput value={contactDraft.whatsapp ?? ""} onChange={v => setContactDraft((d: any) => ({ ...d, whatsapp: v }))} placeholder="+91 00000 00000" />
          </div>
        </div>
        <InputField label={<span>Alternate Email <span className="text-[#9E9EA7] font-normal">(Optional)</span></span>} type="email" value={contactDraft.alternate_email ?? ""} onChange={v => setContactDraft((d: any) => ({ ...d, alternate_email: v }))} placeholder="Optional" />
        
        <p className="text-[12px] font-bold text-[#6E6E73] uppercase tracking-widest mt-1">Social Links</p>
        <InputField label={<span>LinkedIn URL <span className="text-[#9E9EA7] font-normal">(Optional)</span></span>} type="url" value={contactDraft.linkedin ?? ""} onChange={v => setContactDraft((d: any) => ({ ...d, linkedin: v }))} placeholder="https://linkedin.com/in/..." />
        <InputField label={<span>GitHub URL <span className="text-[#9E9EA7] font-normal">(Optional)</span></span>} type="url" value={contactDraft.github ?? ""} onChange={v => setContactDraft((d: any) => ({ ...d, github: v }))} placeholder="https://github.com/..." />
      </EditModal>
    </div>
  );
}
