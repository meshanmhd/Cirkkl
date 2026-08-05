'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface GalleryItem {
  id: string | number;
  image: string;
  title?: string;
  description?: string;
  category?: string;
}

interface AccordionGalleryProps {
  items: GalleryItem[];
}

export function AccordionGallery({ items }: AccordionGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (isHovering || selectedItem) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [items.length, isHovering, selectedItem]);

  return (
    <>
      {/* Hide scrollbar for cleaner look, allow horizontal scrolling if many items */}
      <div
        className="flex w-full h-[450px] sm:h-[550px] gap-2 overflow-x-auto pb-4 custom-scrollbar"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer rounded-2xl overflow-hidden flex-shrink-0 ${isActive ? 'w-[253px] sm:w-[309px]' : 'w-[60px] sm:w-[80px]'
                }`}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <img
                src={item.image}
                alt={item.title || `Gallery image ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Optional overlay for inactive items to make active one pop */}
              {!isActive && (
                <div className="absolute inset-0 bg-black/30 transition-opacity duration-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Placeholder Popup */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative animate-fade-up">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-full h-64 relative">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-[#F3F0FF] text-[#7B61FF] text-xs font-semibold rounded-lg">
                  {selectedItem.category || 'Event'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#111111] mb-2">
                {selectedItem.title}
              </h3>
              <p className="text-[#6E6E73] leading-relaxed mb-6">
                {selectedItem.description || 'Detailed information about this event will go here...'}
              </p>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-[#111111] bg-[#cfe467] transition-all hover:opacity-90"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
