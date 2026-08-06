'use client';

import { useState, useRef } from 'react';
import { ArrowRight, X, ChevronDown } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type CustomField = {
  id?: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
};

interface SlideButtonProps {
  onComplete?: () => void;
  eventId?: string;
  customFields?: CustomField[];
  isFull?: boolean;
  approvalRequired?: boolean;
}

function RegistrationModal({
  fields,
  onClose,
  onSubmit,
  loading,
}: {
  fields: CustomField[];
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  loading: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = (label: string, val: string) => {
    setValues(prev => ({ ...prev, [label]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-white text-[14px] text-[#111111] placeholder:text-[#9E9EA7] focus:outline-none focus:border-[#cfe467] focus:ring-2 focus:ring-[#cfe467]/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E5EA]">
          <div>
            <h2 className="text-[17px] font-bold text-[#111111]">Registration Details</h2>
            <p className="text-[13px] text-[#6E6E73] mt-0.5">Fill in the info below to complete your registration.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {fields.map((field, i) => (
            <div key={i}>
              <label className="block text-[13px] font-semibold text-[#111111] mb-1.5">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === "select" ? (
                <select
                  required={field.required}
                  value={values[field.label] || ""}
                  onChange={e => handleChange(field.label, e.target.value)}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="">Select an option</option>
                  {(field.options || "").split(",").map(o => o.trim()).filter(Boolean).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
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
                  type={field.type}
                  required={field.required}
                  placeholder={field.label}
                  value={values[field.label] || ""}
                  onChange={e => handleChange(field.label, e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          ))}
        </form>
        <div className="px-6 pb-6 pt-4 border-t border-[#E5E5EA]">
          <button
            onClick={(e) => handleSubmit(e as any)}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-[#111111] transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:transform-none"
            style={{ background: "linear-gradient(135deg, #cfe467 0%, #b8d44e 100%)" }}
          >
            {loading ? "Registering…" : "Confirm Registration"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const SlideButton = ({ onComplete, eventId, customFields = [], isFull = false, approvalRequired = false }: SlideButtonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const hasCustomFields = customFields.length > 0;
  
  const pendingStatus = isFull || approvalRequired;
  const successMessage = isFull ? "Pending (Waitlist) ⏳" : (approvalRequired ? "Pending Approval ⏳" : "Registered! 🎉");

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCompleted) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !thumbRef.current || isCompleted) return;
    const container = containerRef.current.getBoundingClientRect();
    const thumb = thumbRef.current.getBoundingClientRect();
    const maxScroll = container.width - thumb.width - 8;
    let newX = e.clientX - container.left - (thumb.width / 2);
    newX = Math.max(0, Math.min(newX, maxScroll));
    setPosition(newX);
    if (newX >= maxScroll - 5) {
      setIsDragging(false);
      if (hasCustomFields) {
        setPosition(0);
        setShowModal(true);
      } else {
        doRegister({});
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isCompleted) return;
    setIsDragging(false);
    if (!showModal) setPosition(0);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

    const doRegister = async (fieldValues: Record<string, string>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && eventId) {
        const ticketCode = `CLLK-${Math.floor(10000 + Math.random() * 90000)}`;
        await supabase.from('registrations').insert({
          event_id: eventId,
          user_id: user.id,
          custom_field_values: fieldValues,
          status: pendingStatus ? 'pending' : 'approved',
          ticket_code: ticketCode
        });
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

  return (
    <>
      {showModal && (
        <RegistrationModal
          fields={customFields}
          onClose={() => { setShowModal(false); setPosition(0); }}
          onSubmit={doRegister}
          loading={loading}
        />
      )}
      <div
        ref={containerRef}
        className="relative w-full h-[64px] bg-[#111111] rounded-full flex items-center overflow-hidden touch-none select-none shadow-md border border-black/5"
      >
        <div
          className="absolute inset-0 flex items-center justify-center text-white/90 text-[16px] font-semibold tracking-wide z-0 ml-8 pointer-events-none transition-opacity duration-200"
          style={{ opacity: isCompleted ? 0 : Math.max(0, 1 - (position / 80)) }}
        >
          {isCompleted ? "" : hasCustomFields ? "Slide to Fill & Register" : "Slide to Register"}
        </div>

        <div
          className="absolute left-0 top-0 bottom-0 bg-[#cfe467] z-0 rounded-l-full"
          style={{ width: `${position + 32}px`, transition: isDragging ? 'none' : 'width 0.3s ease' }}
        />
        <div
          className="absolute top-0 bottom-0 w-[64px] bg-[#cfe467] z-0 rounded-full"
          style={{ left: `${position}px`, transition: isDragging ? 'none' : 'left 0.3s ease' }}
        />

        <div
          ref={thumbRef}
          className="absolute z-10 left-1 w-[56px] h-[56px] bg-white rounded-full flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing"
          style={{ transform: `translateX(${position}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <ArrowRight size={20} className="text-[#111111]" />
        </div>

        {isCompleted && (
          <div className={`absolute inset-0 flex items-center justify-center text-[#111111] font-bold z-20 animate-fade-in text-lg ${pendingStatus ? 'bg-[#F5F5F7]' : 'bg-[#cfe467]'}`}>
            {successMessage}
          </div>
        )}
      </div>
    </>
  );
};
