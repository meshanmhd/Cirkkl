'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, X, CheckCircle2, ChevronDown, Upload, ArrowLeft, Clock, Check, PartyPopper, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { LoginForm } from '@/components/auth/LoginForm';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { DotQRCode } from "./DotQRCode";
import { registerForEvent } from '@/app/actions/registration';

type CustomField = {
  id?: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
};

interface SlideButtonProps {
  onComplete?: () => void;
  event: any;
  isFull?: boolean;
  userRegistration?: any;
  label?: string;
}

// ----------------------------------------------------------------------
// Custom Select Component
// ----------------------------------------------------------------------
function CustomSelect({ options, value, onChange, placeholder, required }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        required={required}
        value={value}
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        onChange={() => { }}
        onFocus={() => setOpen(true)}
      />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-left focus:outline-none focus:border-[#D1D1D6] transition-all ${!value ? 'text-[#9E9EA7]' : 'text-[#111111]'}`}
      >
        <span>{value || placeholder || "Select an option"}</span>
        <ChevronDown size={16} className={`text-[#6E6E73] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E5EA] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto py-1">
          {options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-[14px] text-[#111111] hover:bg-[#F5F5F7] transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// ----------------------------------------------------------------------
// Dumb Slide Button Component
// ----------------------------------------------------------------------
function SlideButtonBase({
  label,
  disabled,
  loading,
  onSlideComplete,
  successMessage,
  isCompleted: externalCompleted
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onSlideComplete: () => void;
  successMessage?: string;
  isCompleted?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (externalCompleted || disabled || loading) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !thumbRef.current || externalCompleted || disabled) return;
    const container = containerRef.current.getBoundingClientRect();
    const thumb = thumbRef.current.getBoundingClientRect();
    const maxScroll = container.width - thumb.width - 8;
    let newX = e.clientX - container.left - (thumb.width / 2);
    newX = Math.max(0, Math.min(newX, maxScroll));
    setPosition(newX);
    if (newX >= maxScroll - 5) {
      setIsDragging(false);
      onSlideComplete();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (externalCompleted) return;
    setIsDragging(false);
    setPosition(0);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[56px] rounded-[14px] flex items-center overflow-hidden touch-none select-none border ${externalCompleted ? 'border-[#E5E5EA] bg-[#F6F7F0]' :
        disabled ? 'bg-[#F5F5F7] border-[#E5E5EA] opacity-60' : 'bg-[#111111] border-black/5'
        }`}
    >
      <div
        className={`absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-[14px] font-bold tracking-wide z-0 pointer-events-none transition-opacity duration-200 ${disabled ? 'text-[#9E9EA7]' : 'text-white/90'}`}
        style={{ opacity: externalCompleted ? 0 : Math.max(0, 1 - (position / 60)), paddingLeft: '50px' }}
      >
        {externalCompleted ? "" : loading ? "Processing..." : label}
      </div>

      <div
        className={`absolute left-0 top-0 bottom-0 z-0 ${disabled ? 'bg-[#E5E5EA]' : 'bg-[#cfe467]'}`}
        style={{
          width: `${position + 56}px`,
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
          transition: isDragging ? 'none' : 'width 0.3s ease'
        }}
      />

      <div
        ref={thumbRef}
        className={`absolute z-10 inset-y-[5px] left-[5px] w-[46px] bg-white rounded-[10px] flex items-center justify-center shadow-sm ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ transform: `translateX(${position}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ArrowRight size={16} className={disabled ? "text-[#9E9EA7]" : "text-[#111111]"} />
      </div>

      {externalCompleted && (() => {
        const isAttended = successMessage === 'Thank you for attending' || successMessage === 'Thankyou for attending';
        const isPending = successMessage?.includes('Pending');
        const cfg = isAttended
          ? { bg: 'bg-[#F6F7F0]', iconBg: 'bg-[#cfe467]/40', iconColor: 'text-[#4a6000]', Icon: PartyPopper, label: 'Thank you for attending', sub: 'See you at the next one!' }
          : isPending
            ? { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', Icon: Clock, label: successMessage!, sub: "We'll notify you once confirmed." }
            : { bg: 'bg-[#F6F7F0]', iconBg: 'bg-[#cfe467]/40', iconColor: 'text-[#4a6000]', Icon: Check, label: 'Registered', sub: "We're glad you're part of this!" };
        return (
          <div className={`absolute inset-0 flex items-center px-3 gap-2.5 z-40 animate-fade-in rounded-[14px] ${cfg.bg}`}>
            <div className={`w-8 h-8 rounded-[10px] ${cfg.iconBg} flex items-center justify-center shrink-0`}>
              <cfg.Icon size={16} className={cfg.iconColor} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-[13px] leading-tight text-[#111111] tracking-tight">
                {cfg.label}
              </span>
              <span className="text-[11px] text-[#6E6E73] font-medium">
                {cfg.sub}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ----------------------------------------------------------------------
// Registration Modal Component
// ----------------------------------------------------------------------
function RegistrationModal({
  event,
  onClose,
  onSubmit,
  loading,
}: {
  event: any;
  onClose: () => void;
  onSubmit: (values: Record<string, string>, transactionId: string, ticketTierId: string, paymentProofFile: File | null, teamName: string, teamMates: any[]) => void;
  loading: boolean;
}) {
  const customFields: CustomField[] = event.custom_fields || [];
  const ticketTypes: any[] = event.ticket_types || [];
  const isPaid = event.price === "paid";
  const isTeamEvent = event.is_team_event === true;
  const teamMinSize = event.team_min_size || 1;
  const teamMaxSize = event.team_max_size || 1;

  const steps: string[] = [];
  if (customFields.length > 0) steps.push("custom_fields");
  if (isTeamEvent) steps.push("team_creation");
  if (isPaid && ticketTypes.length > 1) steps.push("ticket_select");
  if (isPaid) steps.push("payment");

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx] || "done";
  const isLastStep = currentStepIdx === steps.length - 1 || steps.length === 0;

  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ticketTypes[0]?.id || "");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(ticketTypes[0]?.id || null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [teamMates, setTeamMates] = useState<{ id: string, name: string, ckl_id: string }[]>([]);
  const [teammateSearch, setTeammateSearch] = useState("");
  const [teammateSearchLoading, setTeammateSearchLoading] = useState(false);
  const [teammateSearchError, setTeammateSearchError] = useState("");
  const [stepError, setStepError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId) || ticketTypes[0];
  const qrCodeUrl = selectedTicket?.qr_code_url || ticketTypes[0]?.qr_code_url;

  const handleChange = (label: string, val: string) => {
    setValues(prev => ({ ...prev, [label]: val }));
  };

  const validateCurrentStep = () => {
    setStepError("");
    if (currentStep === "custom_fields") {
      for (const field of customFields) {
        if (field.required) {
          const val = values[field.label];
          if (!val || val.trim() === '' || val === 'false') {
            setStepError(`Please fill out the required field: ${field.label}`);
            return false;
          }
        }
      }
    }

    if (currentStep === "team_creation") {
      const totalMembers = teamMates.length + 1;
      if (totalMembers < teamMinSize) {
        setStepError(`You need at least ${teamMinSize} members in your team (including yourself). Add more teammates.`);
        return false;
      }
    }

    const form = document.getElementById("reg-modal-form") as HTMLFormElement;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return false;
    }

    if (currentStep === "payment" && isPaid && !paymentProofFile) {
      setStepError("Please upload a payment screenshot.");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setStepError("");
    if (!validateCurrentStep()) return;
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(idx => idx + 1);
    }
  };

  const isSlideDisabled =
    (currentStep === "payment" && (!transactionId.trim() || !paymentProofFile || !declarationChecked)) ||
    (currentStep === "ticket_select" && !selectedTicketId);

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-[#111111] placeholder:text-[#9E9EA7] focus:outline-none focus:border-[#D1D1D6] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-[24px] border border-[#E5E5EA] overflow-hidden flex flex-col h-[560px]">

        {/* Stepper */}
        {steps.length > 1 && (
          <div className="flex items-center gap-1.5 px-5 pt-5 pb-0 shrink-0">
            {steps.map((step, idx) => (
              <div key={step} className={`h-[3px] flex-1 rounded-full transition-colors ${idx <= currentStepIdx ? 'bg-[#cfe467]' : 'bg-[#F0F0F2]'}`} />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#E5E5EA] shrink-0">
          <button
            onClick={currentStepIdx > 0 ? () => setCurrentStepIdx(idx => idx - 1) : onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors shrink-0"
          >
            <ArrowLeft size={15} strokeWidth={2} />
          </button>
          <div>
            <h2 className="text-[15px] font-bold text-[#111111] tracking-tight">Registration</h2>
            <p className="text-[12px] text-[#9E9EA7] font-medium mt-0.5">
              {currentStep === "team_creation" ? "Create your team." :
                currentStep === "custom_fields" ? "Fill in your details below." :
                  currentStep === "ticket_select" ? "Choose your ticket type." :
                    currentStep === "payment" ? "Complete your payment to confirm." :
                      currentStep === "confirmation" ? "Final confirmation." : ""}
            </p>
          </div>
        </div>

        <form id="reg-modal-form" className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="px-5 pt-5 pb-2 flex flex-col gap-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#E5E5EA] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">

            {/* Team Creation */}
            {currentStep === "team_creation" && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">
                    Team Name<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider flex justify-between">
                    <span>Add Teammates<span className="text-red-400 ml-0.5">*</span></span>
                    <span className="lowercase text-[#6E6E73] font-medium">Min {teamMinSize} members</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#111111] font-medium text-[14px]">CKL-</span>
                      <input
                        type="text"
                        placeholder="Enter ID number"
                        value={teammateSearch}
                        onChange={(e) => setTeammateSearch(e.target.value.replace(/[^0-9]/g, ''))}
                        className={`${inputCls} pl-[54px]`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('add-teammate-btn')?.click();
                          }
                        }}
                      />
                    </div>
                    <button
                      id="add-teammate-btn"
                      type="button"
                      disabled={teammateSearchLoading || !teammateSearch}
                      onClick={async () => {
                        setTeammateSearchError("");
                        setTeammateSearchLoading(true);
                        const { data, error } = await supabase
                          .from('users')
                          .select('id, full_name, qr_code')
                          .ilike('qr_code', `%-${teammateSearch}`)
                          .limit(1)
                          .maybeSingle();

                        if (error || !data) {
                          setTeammateSearchLoading(false);
                          setTeammateSearchError("User not found with this ID.");
                          return;
                        }

                        // Prevent adding self
                        const { data: { user: currentUser } } = await supabase.auth.getUser();
                        if (currentUser && data.id === currentUser.id) {
                          setTeammateSearchLoading(false);
                          setTeammateSearchError("You are already the team leader.");
                          return;
                        }

                        // Check if already registered
                        const { data: existingReg } = await supabase
                          .from('registrations')
                          .select('id')
                          .eq('event_id', event.id)
                          .eq('user_id', data.id)
                          .maybeSingle();

                        if (existingReg) {
                          setTeammateSearchLoading(false);
                          setTeammateSearchError("User is already registered for this event.");
                          return;
                        }

                        // Check if in another team for this event (even pending)
                        const { data: existingTeamMember, error: teamCheckErr } = await supabase
                          .from('team_members')
                          .select('id, teams!inner(event_id)')
                          .eq('teams.event_id', event.id)
                          .eq('user_id', data.id)
                          .maybeSingle();

                        if (existingTeamMember) {
                          setTeammateSearchLoading(false);
                          setTeammateSearchError("User is already invited or in a team for this event.");
                          return;
                        }

                        setTeammateSearchLoading(false);


                        if (teamMates.find(m => m.id === data.id)) {
                          setTeammateSearchError("User already added to team.");
                          return;
                        }

                        if (teamMates.length + 1 >= teamMaxSize) {
                          setTeammateSearchError(`Max team size is ${teamMaxSize}.`);
                          return;
                        }

                        setTeamMates([...teamMates, { id: data.id, name: data.full_name, ckl_id: data.qr_code }]);
                        setTeammateSearch("");
                      }}
                      className="px-6 h-[46px] flex items-center justify-center border border-[#E5E5EA] bg-white text-[#111111] rounded-xl transition-colors hover:bg-[#F5F5F7] disabled:opacity-50 shrink-0"
                    >
                      <Plus size={20} strokeWidth={2} />
                    </button>
                  </div>
                  {teammateSearchError && <p className="text-red-500 text-[12px]">{teammateSearchError}</p>}

                  <div className="mt-3 flex flex-col gap-2">
                    {/* Fixed Team Leader Card */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[#cfe467] bg-[#cfe467]/10">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#111111] text-[13px]">You (Team Leader)</span>
                        <span className="text-[#6E6E73] text-[11px]">Required</span>
                      </div>
                      <div className="p-2">
                        <CheckCircle2 size={16} className="text-[#4a6000]" />
                      </div>
                    </div>
                    
                    {/* Added Teammates */}
                    {teamMates.map(mate => (
                      <div key={mate.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E5EA] bg-[#F9F9F9]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#111111] text-[13px]">{mate.name}</span>
                          <span className="text-[#6E6E73] text-[11px]">{mate.ckl_id}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTeamMates(teamMates.filter(m => m.id !== mate.id))}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[12px] text-[#6E6E73] text-right mt-1">
                    {teamMates.length + 1} / {teamMaxSize} members
                  </p>
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {currentStep === "custom_fields" && (
              <div className="flex flex-col gap-5">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    {field.type === "select" && field.options ? (
                      <CustomSelect
                        options={field.options.split(",").map(s => s.trim())}
                        value={values[field.label] || ""}
                        onChange={(v) => setValues(prev => ({ ...prev, [field.label]: v }))}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        required={field.required}
                        value={values[field.label] || ""}
                        onChange={e => setValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                        className={inputCls}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ticket Select */}
            {currentStep === "ticket_select" && (
              <div className="flex flex-col gap-2.5">
                <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider mb-1">Available Tickets</p>
                {ticketTypes.map(t => (
                  <label
                    key={t.id}
                    className={`flex flex-col p-4 rounded-[14px] border cursor-pointer transition-all ${selectedTicketId === t.id ? 'border-[#cfe467] bg-[#cfe467]/5' : 'border-[#E5E5EA] hover:border-[#D1D1D6]'}`}
                    onClick={() => setSelectedTicketId(t.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${selectedTicketId === t.id ? 'border-[#8aab00] bg-[#cfe467]' : 'border-[#D1D1D6] bg-white'}`} />
                        <p className="font-semibold text-[14px] text-[#111111]">{t.name} Ticket</p>
                      </div>
                      <p className="font-bold text-[14px] text-[#111111]">₹{t.price}</p>
                    </div>
                    <div className="ml-7 mt-2">
                      <button type="button" onClick={(e) => { e.preventDefault(); setExpandedTicketId(expandedTicketId === t.id ? null : t.id); }} className="flex items-center gap-1 text-[12px] font-medium text-[#9E9EA7] hover:text-[#111111] transition-colors">
                        Details <ChevronDown size={13} className={`transition-transform ${expandedTicketId === t.id ? "rotate-180" : ""}`} />
                      </button>
                      {expandedTicketId === t.id && (
                        <p className="mt-1.5 text-[12px] text-[#6E6E73] leading-relaxed">{t.description || `Full access to the ${t.name} tier. Please arrive on time with your ticket code.`}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Payment */}
            {currentStep === "payment" && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-1.5 bg-[#F7F7F8] rounded-[16px] p-4 border border-[#E5E5EA]">
                  <p className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">Scan & Pay</p>
                  <p className="text-[20px] font-bold text-[#111111] tracking-tight">₹{selectedTicket?.price || event.priceAmount || "0"}</p>
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-36 h-36 rounded-[12px] border border-[#E5E5EA] object-cover" />
                  ) : (
                    <div className="w-36 h-36 rounded-[12px] border border-dashed border-[#E5E5EA] flex items-center justify-center text-[12px] text-[#9E9EA7]">No QR Code</div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">
                    Payment Screenshot<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  {!paymentProofPreview ? (
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-[12px] border border-dashed border-[#E5E5EA] bg-[#F7F7F8] hover:bg-[#F0F0F2] transition-colors cursor-pointer">
                      <Upload size={15} className="text-[#9E9EA7]" />
                      <span className="text-[13px] font-medium text-[#111111]">Upload Screenshot</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setPaymentProofFile(file); setPaymentProofPreview(URL.createObjectURL(file)); }
                      }} />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-[12px] border border-[#E5E5EA] bg-white">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img src={paymentProofPreview} alt="Preview" className="w-8 h-8 rounded-[8px] object-cover border border-[#E5E5EA]" />
                        <span className="text-[13px] font-medium text-[#111111] truncate">{paymentProofFile?.name}</span>
                      </div>
                      <button type="button" onClick={() => { setPaymentProofFile(null); setPaymentProofPreview(null); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F5F7] text-[#9E9EA7] hover:text-red-500 transition-colors shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-[#9E9EA7] uppercase tracking-wider">
                    Transaction ID<span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter UPI / Transaction ID"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value.replace(/[^0-9]/g, ''))}
                    className={inputCls}
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={declarationChecked}
                    onChange={e => setDeclarationChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#111111] rounded mt-0.5 shrink-0"
                  />
                  <span className="text-[12px] text-[#6E6E73] leading-relaxed font-medium">
                    I confirm payment of the required amount and agree to the event's cancellation and refund policies.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-4 bg-white border-t border-[#E5E5EA] shrink-0">
            {stepError && <p className="text-red-500 text-[12px] font-medium mb-3 text-center">{stepError}</p>}
            {isLastStep ? (
              <button
                type="button"
                onClick={() => {
                  if (!validateCurrentStep()) return;
                  onSubmit(values, transactionId, selectedTicketId, paymentProofFile, teamName, teamMates);
                }}
                className="w-full py-3 rounded-[14px] text-[14px] font-bold text-[#111111] bg-[#cfe467] hover:bg-[#c0d955] transition-colors cursor-pointer"
              >
                Register Now
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 rounded-[14px] text-[14px] font-bold text-[#111111] bg-[#cfe467] hover:bg-[#c0d955] transition-colors cursor-pointer"
              >
                Next Step
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


// ----------------------------------------------------------------------
// Main Controller Component
// ----------------------------------------------------------------------
export const SlideButton = ({ onComplete, event, isFull = false, userRegistration, label }: SlideButtonProps) => {
  const [isCompleted, setIsCompleted] = useState(!!userRegistration && userRegistration.status !== 'cancelled');
  const [showModal, setShowModal] = useState(false);
  const [showAckModal, setShowAckModal] = useState(false);
  const [regData, setRegData] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) setShowLoginModal(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsCompleted(!!userRegistration && userRegistration.status !== 'cancelled');
  }, [userRegistration]);

  const isRegistrationClosed = (() => {
    if (!event?.registration_deadline) return false;
    const now = new Date();
    const deadlineStr = event.registration_deadline +
      (event.registration_end_time ? `T${event.registration_end_time}` : 'T23:59:59');
    return now > new Date(deadlineStr);
  })();

  const customFields: CustomField[] = event?.custom_fields || [];
  const ticketTypes: any[] = event?.ticket_types || [];
  const isPaid = event?.price === "paid";
  const isTeamEvent = event?.is_team_event === true;

  const steps: string[] = [];
  if (isTeamEvent) steps.push("team_creation");
  if (customFields.length > 0) steps.push("custom_fields");
  if (isPaid && ticketTypes.length > 1) steps.push("ticket_select");
  if (isPaid) steps.push("payment");

  const requiresModal = steps.length > 0;

  const approvalRequired = event?.approval_required || event?.price === "paid";
  const pendingStatus = isFull || approvalRequired;
  const successMessage = userRegistration
    ? ((userRegistration.attended === true || userRegistration.attended === 'true' || userRegistration.status === 'attended') ? "Thank you for attending" : userRegistration.status === 'pending' ? "Pending Approval" : "Registered")
    : (isFull ? "Pending (Waitlist)" : (approvalRequired ? "Pending Approval" : "Registered"));

  const doRegister = async (
    fieldValues: Record<string, string> = {},
    transactionId: string = '',
    ticketTierId: string = '',
    paymentProofFile: File | null = null,
    teamName: string = '',
    teamMates: any[] = []
  ) => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setShowLoginModal(true);
        return;
      }

      let paymentProofUrl: string | null = null;
      if (paymentProofFile) {
        const fileExt = paymentProofFile.name.split('.').pop();
        const fileName = `${currentUser.id}_${event.id}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('payment_proofs')
          .upload(fileName, paymentProofFile);
        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('payment_proofs')
            .getPublicUrl(fileName);
          paymentProofUrl = publicUrlData.publicUrl;
        }
      }

      const result = await registerForEvent({
        eventId: event.id,
        fieldValues,
        transactionId,
        ticketTierId,
        paymentProofUrl,
        pendingStatus,
        isTeamEvent: event.is_team_event === true,
        teamName,
        teamMates,
        ticketTypeCount: ticketTypes.length,
        firstTicketTypeId: ticketTypes[0]?.id ?? null,
      });

      if (!result.success) {
        alert(result.error);
        return;
      }

      setIsCompleted(true);
      setShowModal(false);
      if (onComplete) onComplete();
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (requiresModal) {
      setShowModal(true);
    } else {
      setShowAckModal(true);
    }
  };

  const handleModalSubmit = (values: Record<string, string>, transactionId: string, selectedTicketId: string, paymentProofFile: File | null, teamName: string, teamMates: any[]) => {
    setRegData({ values, transactionId, selectedTicketId, paymentProofFile, teamName, teamMates });
    setShowModal(false);
    setShowAckModal(true);
  };

  return (
    <>
      {showLoginModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden p-8">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors">
              <X size={16} />
            </button>
            <LoginForm redirectTo={pathname} />
          </div>
        </div>,
        document.body
      )}

      {showModal && typeof document !== 'undefined' && createPortal(
        <RegistrationModal
          event={event}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          loading={loading}
        />,
        document.body
      )}

      {showAckModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAckModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E5EA] shrink-0">
              <h2 className="text-xl font-bold text-[#111111]">Join the Adventure!</h2>
              <button onClick={() => setShowAckModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-[14px] text-[#6E6E73] leading-relaxed mb-6">
                Confirm your spot and connect with others at <span className="font-semibold text-[#111111]">{event.title}</span>
              </p>
              <div className="flex flex-col gap-3 mb-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="ack-check-1" className="w-4 h-4 accent-[#111111] rounded mt-0.5 shrink-0" />
                  <span className="text-[13px] text-[#6E6E73] leading-relaxed font-medium">
                    I acknowledge that I have read and understood the event details and agree to participate in the event in accordance with the guidelines and instructions provided.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="ack-check-2" className="w-4 h-4 accent-[#111111] rounded mt-0.5 shrink-0" />
                  <span className="text-[13px] text-[#6E6E73] leading-relaxed font-medium">
                    I agree to the <a href="#" className="underline decoration-[#9E9EA7] hover:text-[#111111] transition-colors">community guidelines</a>.
                  </span>
                </label>
              </div>
              <SlideButtonBase
                label="Slide to Confirm"
                loading={loading}
                onSlideComplete={() => {
                  const chk1 = document.getElementById("ack-check-1") as HTMLInputElement;
                  const chk2 = document.getElementById("ack-check-2") as HTMLInputElement;
                  if ((chk1 && !chk1.checked) || (chk2 && !chk2.checked)) {
                    alert("Please acknowledge the terms and conditions before proceeding.");
                    return;
                  }
                  if (regData) {
                    doRegister(regData.values, regData.transactionId, regData.selectedTicketId, regData.paymentProofFile, regData.teamName, regData.teamMates).then(() => setShowAckModal(false));
                  } else {
                    doRegister().then(() => setShowAckModal(false));
                  }
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {isRegistrationClosed && !isCompleted ? (
        <button
          disabled
          className="w-full py-4 rounded-2xl text-[16px] font-bold text-[#9E9EA7] bg-[#F5F5F7] border border-[#E5E5EA] cursor-not-allowed"
        >
          Registration Closed
        </button>
      ) : !isCompleted ? (
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl text-[16px] font-bold text-[#111111] transition-all hover:opacity-90 bg-[#cfe467]"
        >
          {label || "Register for Event"}
        </button>
      ) : (
        <SlideButtonBase
          label={label || "Slide to Register"}
          isCompleted={isCompleted}
          loading={loading}
          successMessage={successMessage}
          disabled={isRegistrationClosed && !isCompleted}
          onSlideComplete={() => { }}
        />
      )}
    </>
  );
};
