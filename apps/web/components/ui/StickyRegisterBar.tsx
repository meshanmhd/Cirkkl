'use client';

import { useState, useEffect } from 'react';
import { SlideButton } from '@/components/ui/SlideButton';
import { Calendar, Clock } from 'lucide-react';

interface StickyRegisterBarProps {
  event: any;
  isFull: boolean;
  userRegistration: any;
  formattedDate: string;
  formattedTime: string;
  isEnded: boolean;
}

export function StickyRegisterBar({
  event,
  isFull,
  userRegistration,
  formattedDate,
  formattedTime,
  isEnded
}: StickyRegisterBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If the event has ended and user has no registration, never show
    if (isEnded && !userRegistration) {
      setVisible(false);
      return;
    }

    const card = document.getElementById('register-card');
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If the card is NOT intersecting (out of view), show the bar
        const entry = entries[0];
        setVisible(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [isEnded, userRegistration]);

  const isRegistrationClosed = (() => {
    if (!event?.registration_deadline) return false;
    const now = new Date();
    const deadlineStr = event.registration_deadline +
      (event.registration_end_time ? `T${event.registration_end_time}` : 'T23:59:59');
    return now > new Date(deadlineStr);
  })();

  // Only show if the user has NOT registered (or was cancelled), the event has not ended, and registration is not closed
  if ((userRegistration && userRegistration.status !== 'cancelled') || isEnded || isRegistrationClosed) return null;

  return (
    <div
      className={`fixed z-50 transform transition-all duration-400 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'
      } bottom-0 left-0 right-0 lg:bottom-6 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[640px] lg:max-w-[92vw]`}
    >
      <div className="bg-white/90 backdrop-blur-xl border-t lg:border border-[#E5E5EA]/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] lg:shadow-[0_20px_40px_rgba(0,0,0,0.08)] lg:rounded-[24px] pb-[env(safe-area-inset-bottom)] lg:pb-0">
        <div className="px-5 py-4 lg:p-3 flex items-center justify-between gap-5">
          {/* Left: Info */}
          <div className="flex-1 min-w-0 lg:pl-3">
            <h4 className="text-[15px] font-bold text-[#111111] truncate mb-1.5">
              {event.title}
            </h4>
            <div className="flex items-center gap-3 text-[13px] font-medium text-[#6E6E73] truncate">
              <span className="flex items-center gap-1.5 shrink-0">
                <Calendar size={14} className="text-[#9E9EA7]" strokeWidth={2.5} />
                <span className="text-[#333333]">{formattedDate}</span>
              </span>
              {formattedTime && (
                <span className="flex items-center gap-1.5 shrink-0">
                  <Clock size={14} className="text-[#9E9EA7]" strokeWidth={2.5} />
                  <span className="text-[#333333]">{formattedTime}</span>
                </span>
              )}
              <span className="w-1 h-1 rounded-full bg-[#D1D1D6] shrink-0" />
              <span className="text-[#111111] shrink-0 font-bold bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-[#E5E5EA]/50">
                {event.price === 'paid' ? 'Paid' : 'Free'}
              </span>
            </div>
          </div>

          {/* Right: SlideButton */}
          <div className="w-[150px] shrink-0">
            <SlideButton
              event={event}
              isFull={isFull}
              userRegistration={userRegistration}
              label="Register"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
