'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, X, CheckCircle2, ChevronDown, Upload } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { LoginForm } from '@/components/auth/LoginForm';
import { usePathname } from 'next/navigation';

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
        onChange={() => {}}
        onFocus={() => setOpen(true)}
      />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-left focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all ${!value ? 'text-[#9E9EA7]' : 'text-[#111111]'}`}
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
      className={`relative w-full h-[64px] rounded-full flex items-center overflow-hidden touch-none select-none shadow-md border ${disabled ? 'bg-[#F5F5F7] border-[#E5E5EA] opacity-60' : 'bg-[#111111] border-black/5'}`}
    >
      <div
        className={`absolute inset-0 flex items-center justify-center text-[16px] font-semibold tracking-wide z-0 ml-8 pointer-events-none transition-opacity duration-200 ${disabled ? 'text-[#9E9EA7]' : 'text-white/90'}`}
        style={{ opacity: externalCompleted ? 0 : Math.max(0, 1 - (position / 80)) }}
      >
        {externalCompleted ? "" : loading ? "Processing..." : label}
      </div>

      <div
        className={`absolute left-0 top-0 bottom-0 z-0 rounded-l-full ${disabled ? 'bg-[#E5E5EA]' : 'bg-[#cfe467]'}`}
        style={{ width: `${position + 32}px`, transition: isDragging ? 'none' : 'width 0.3s ease' }}
      />
      <div
        className={`absolute top-0 bottom-0 w-[64px] z-0 rounded-full ${disabled ? 'bg-[#E5E5EA]' : 'bg-[#cfe467]'}`}
        style={{ left: `${position}px`, transition: isDragging ? 'none' : 'left 0.3s ease' }}
      />

      <div
        ref={thumbRef}
        className={`absolute z-10 left-1 w-[56px] h-[56px] bg-white rounded-full flex items-center justify-center shadow-sm ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ transform: `translateX(${position}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ArrowRight size={20} className={disabled ? "text-[#9E9EA7]" : "text-[#111111]"} />
      </div>

      {externalCompleted && (
        <div className={`absolute inset-0 flex items-center justify-center text-[#111111] font-bold z-20 animate-fade-in text-lg ${!successMessage?.includes('Pending') ? 'bg-[#cfe467]' : 'bg-[#F5F5F7]'}`}>
          {successMessage || "Registered"}
        </div>
      )}
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
  onSubmit: (values: Record<string, string>, transactionId: string, ticketTierId: string, paymentProofFile: File | null) => void;
  loading: boolean;
}) {
  const customFields: CustomField[] = event.custom_fields || [];
  const ticketTypes: any[] = event.ticket_types || [];
  const isPaid = event.price === "paid";
  
  const steps: string[] = [];
  if (customFields.length > 0) steps.push("custom_fields");
  if (isPaid && ticketTypes.length > 1) steps.push("ticket_select");
  if (isPaid) steps.push("payment");

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx] || "done";
  const isLastStep = currentStepIdx === steps.length - 1 || steps.length === 0;

  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ticketTypes.length === 1 ? ticketTypes[0].id : "");
  const [transactionId, setTransactionId] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId) || ticketTypes[0];
  const qrCodeUrl = selectedTicket?.qr_code_url || ticketTypes[0]?.qr_code_url;

  const handleChange = (label: string, val: string) => {
    setValues(prev => ({ ...prev, [label]: val }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLastStep) {
      setCurrentStepIdx(idx => idx + 1);
    }
  };

  const isSlideDisabled = 
    (currentStep === "payment" && (!transactionId.trim() || !paymentProofFile || !declarationChecked)) ||
    (currentStep === "ticket_select" && !selectedTicketId);

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-[#111111] placeholder:text-[#9E9EA7] focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E5EA] shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#111111]">Registration</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">
              {currentStep === "custom_fields" ? "Please fill in your details." : 
               currentStep === "ticket_select" ? "Select your ticket type." : 
               currentStep === "payment" ? "Complete your payment." : ""}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <form id="reg-modal-form" onSubmit={handleNext} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
            {currentStep === "custom_fields" && (
              <>
                {customFields.map((field, i) => (
                  <div key={i}>
                    <label className="block text-[13px] font-semibold text-[#111111] mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <CustomSelect
                        required={field.required}
                        value={values[field.label] || ""}
                        onChange={v => handleChange(field.label, v)}
                        placeholder="Select an option"
                        options={(field.options || "").split(",").map(o => o.trim()).filter(Boolean)}
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        rows={3}
                        placeholder={field.label}
                        value={values[field.label] || ""}
                        onChange={e => handleChange(field.label, e.target.value)}
                        className={`${inputCls} resize-none`}
                      />
                    ) : field.type === "checkbox" ? (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={values[field.label] === "true"}
                          onChange={e => handleChange(field.label, e.target.checked ? "true" : "false")}
                          className="w-4 h-4 accent-[#cfe467] rounded"
                        />
                        <span className="text-[14px] text-[#111111]">{field.label}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === "number" ? "text" : field.type}
                        inputMode={field.type === "number" ? "numeric" : undefined}
                        required={field.required}
                        placeholder={field.label}
                        value={values[field.label] || ""}
                        onChange={e => {
                          let val = e.target.value;
                          if (field.type === "number") val = val.replace(/[^0-9]/g, '');
                          handleChange(field.label, val);
                        }}
                        className={inputCls}
                      />
                    )}
                  </div>
                ))}
              </>
            )}

            {currentStep === "ticket_select" && (
              <div className="flex flex-col gap-3">
                {ticketTypes.map(t => (
                  <label key={t.id} className={`flex items-center justify-between p-4 rounded-[16px] border-2 cursor-pointer transition-all ${selectedTicketId === t.id ? 'border-[#cfe467] bg-[#cfe467]/5' : 'border-[#E5E5EA] hover:border-[#D1D1D6]'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedTicketId === t.id ? 'border-[#cfe467] bg-[#cfe467]' : 'border-[#E5E5EA]'}`}>
                        {selectedTicketId === t.id && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#111111]">{t.name}</p>
                        <p className="text-[12px] text-[#6E6E73]">{t.unlimited ? "Unlimited" : (t.quantity ? `${t.quantity} left` : "Available")}</p>
                      </div>
                    </div>
                    <p className="text-[15px] font-bold text-[#111111]">₹{t.price}</p>
                  </label>
                ))}
              </div>
            )}

            {currentStep === "payment" && (
              <div className="flex flex-col gap-5">
                <div className="bg-[#F5F5F7] p-4 rounded-[16px] flex flex-col items-center gap-3">
                  <div className="border-2 border-dotted border-[#E5E5EA] px-5 py-2 rounded-xl mb-1 bg-white">
                    <p className="text-[13px] font-semibold text-[#111111]">Scan and pay ₹{selectedTicket?.price || event.priceAmount || "0"}</p>
                  </div>
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-40 h-40 rounded-[12px] shadow-sm border border-[#E5E5EA] object-cover" />
                  ) : (
                    <div className="w-40 h-40 rounded-[12px] border-2 border-dashed border-[#E5E5EA] flex items-center justify-center text-[12px] text-[#9E9EA7]">No QR Code</div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#111111] mb-1.5">Payment Screenshot <span className="text-red-500">*</span></label>
                    {!paymentProofPreview ? (
                      <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-[#E5E5EA] bg-[#F5F5F7] hover:bg-[#EBEBEF] transition-all cursor-pointer">
                        <Upload size={16} className="text-[#6E6E73]" />
                        <span className="text-[13px] font-medium text-[#111111]">Upload Screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPaymentProofFile(file);
                              setPaymentProofPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5E5EA] bg-white h-[50px]">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img src={paymentProofPreview} alt="Preview" className="w-8 h-8 rounded object-cover border border-[#E5E5EA]" />
                          <span className="text-[13px] font-medium text-[#111111] truncate">{paymentProofFile?.name}</span>
                        </div>
                        <button type="button" onClick={() => { setPaymentProofFile(null); setPaymentProofPreview(null); }} className="p-1.5 text-[#6E6E73] hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#111111] mb-1.5">Transaction ID <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Enter UPI / Transaction ID"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value.replace(/[^0-9]/g, ''))}
                      className={inputCls}
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer bg-[#F5F5F7] p-3 rounded-[12px]">
                  <input
                    type="checkbox"
                    required
                    checked={declarationChecked}
                    onChange={e => setDeclarationChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#cfe467] rounded mt-0.5"
                  />
                  <span className="text-[12px] text-[#6E6E73] leading-relaxed">
                    I acknowledge that I have paid the required amount. I have read and agree to the event's cancellation and refund policies.
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 pt-4 border-t border-[#E5E5EA] shrink-0">
            {isLastStep ? (
              <SlideButtonBase
                label="Slide to Register"
                loading={loading}
                disabled={isSlideDisabled}
                onSlideComplete={() => {
                  // Validate form first
                  const form = document.getElementById("reg-modal-form") as HTMLFormElement;
                  if (form && !form.checkValidity()) {
                    form.reportValidity();
                    return;
                  }
                  onSubmit(values, transactionId, selectedTicketId, paymentProofFile);
                }}
              />
            ) : (
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-[#111111] transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #cfe467 0%, #b8d44e 100%)" }}
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
export const SlideButton = ({ onComplete, event, isFull = false, userRegistration }: SlideButtonProps) => {
  const [isCompleted, setIsCompleted] = useState(!!userRegistration);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) setShowLoginModal(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const customFields: CustomField[] = event?.custom_fields || [];
  const ticketTypes: any[] = event?.ticket_types || [];
  const isPaid = event?.price === "paid";
  
  const steps: string[] = [];
  if (customFields.length > 0) steps.push("custom_fields");
  if (isPaid && ticketTypes.length > 1) steps.push("ticket_select");
  if (isPaid) steps.push("payment");

  const requiresModal = steps.length > 0;
  
  const approvalRequired = event?.approval_required;
  const pendingStatus = isFull || approvalRequired;
  const successMessage = userRegistration 
    ? (userRegistration.status === 'pending' ? "Pending Approval" : "Registered")
    : (isFull ? "Pending (Waitlist)" : (approvalRequired ? "Pending Approval" : "Registered"));

  const doRegister = async (fieldValues: Record<string, string> = {}, transactionId: string = "", ticketTierId: string = "", paymentProofFile: File | null = null) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      if (event?.id) {
        // Fetch user's qr_code from profile to use as ticket code if available, else fallback
        const { data: profile } = await supabase.from('users').select('qr_code').eq('id', user.id).single();
        const finalTicketCode = profile?.qr_code || `ckl-${Math.floor(10000 + Math.random() * 90000)}`;

        let paymentProofUrl = null;
        if (paymentProofFile) {
          const fileExt = paymentProofFile.name.split('.').pop();
          const fileName = `${user.id}_${event.id}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('payment_proofs')
            .upload(fileName, paymentProofFile);
            
          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage.from('payment_proofs').getPublicUrl(fileName);
            paymentProofUrl = publicUrlData.publicUrl;
          }
        }

        const { error: insertError } = await supabase.from('registrations').insert({
          event_id: event.id,
          user_id: user.id,
          custom_field_values: fieldValues,
          status: pendingStatus ? 'pending' : 'approved',
          ticket_code: finalTicketCode,
          transaction_id: transactionId || null,
          ticket_tier_id: ticketTierId || (ticketTypes.length === 1 ? ticketTypes[0].id : null),
          payment_proof_url: paymentProofUrl,
        });
        
        if (insertError) {
          console.error("Insert failed:", insertError);
          alert(`Registration failed: ${insertError.message}`);
          throw new Error(insertError.message);
        }
      }
      setIsCompleted(true);
      setShowModal(false);
      if (onComplete) onComplete();
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
    setShowModal(true);
  };

  return (
    <>
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden p-8">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors">
              <X size={16} />
            </button>
            <LoginForm redirectTo={pathname} />
          </div>
        </div>
      )}
      
      {showModal && (
        <RegistrationModal
          event={event}
          onClose={() => setShowModal(false)}
          onSubmit={doRegister}
          loading={loading}
        />
      )}

      {requiresModal && !isCompleted ? (
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-full text-[16px] font-bold text-[#111111] transition-all hover:opacity-90 shadow-sm"
          style={{ background: "linear-gradient(135deg, #cfe467 0%, #b8d44e 100%)" }}
        >
          Register for Event
        </button>
      ) : (
        <SlideButtonBase
          label="Slide to Register"
          isCompleted={isCompleted}
          loading={loading}
          successMessage={successMessage}
          onSlideComplete={() => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            doRegister();
          }}
        />
      )}
    </>
  );
};
