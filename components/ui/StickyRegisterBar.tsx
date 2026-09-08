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

  // If the event has ended and user has no registration, don't render at all
  if (isEnded && !userRegistration) return null;

  return (
    <div
      className={`fixed z-50 transform transition-transform duration-300 ease-in-out ${
        visible ? 'translate-y-0' : 'translate-y-[150%]'
      } bottom-0 left-0 right-0 lg:bottom-6 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[600px] lg:max-w-[90vw]`}
    >
      <div className="bg-white border-t lg:border border-[#E5E5EA] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:shadow-xl lg:rounded-2xl pb-[env(safe-area-inset-bottom)] lg:pb-0">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-bold text-[#111111] truncate mb-0.5">
              {event.title}
            </h4>
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#6E6E73] truncate">
              <span className="flex items-center gap-1 shrink-0">
                <Calendar size={12} />
                {formattedDate}
              </span>
              {formattedTime && (
                <span className="flex items-center gap-1 shrink-0">
                  <Clock size={12} />
                  {formattedTime}
                </span>
              )}
              <span className="shrink-0">•</span>
              <span className="text-[#111111] shrink-0 font-semibold">
                {event.price === 'paid' ? 'Paid' : 'Free'}
              </span>
            </div>
          </div>

          {/* Right: SlideButton */}
          <div className="w-[140px] shrink-0">
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
