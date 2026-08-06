'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface GalleryItem {
  id: string | number;
  image: string;
  title?: string;
  description?: string;
  category?: string;
  organizer?: string;
  price?: string;
  tags?: string[];
}

interface AccordionGalleryProps {
  items: GalleryItem[];
}

import { SlideButton } from '@/components/ui/SlideButton';

export function AccordionGallery({ items }: AccordionGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (isHovering || selectedItem) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [items.length, isHovering, selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  return (
    <>
      {/* Hide scrollbar for cleaner look, allow horizontal scrolling if many items */}
      <div
        className="flex w-full h-[450px] sm:h-[550px] gap-2 overflow-x-auto pb-4 custom-scrollbar"
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer rounded-2xl overflow-hidden flex-shrink-0 ${isActive ? 'w-[253px] sm:w-[309px]' : 'w-[60px] sm:w-[80px]'
                }`}
              onMouseEnter={() => {
                setActiveIndex(index);
                setIsHovering(true);
              }}
              onMouseLeave={() => setIsHovering(false)}
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

      {/* Popup */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl h-[450px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl relative animate-fade-up flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side: Image (9:16) */}
            <div className="h-64 md:h-full md:aspect-[9/16] relative flex-shrink-0">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Right side: Details */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="p-6 md:p-8 flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 transition-colors">
                <h3 className="text-2xl md:text-3xl font-bold text-[#111111] mb-1.5 leading-tight">
                  {selectedItem.title}
                </h3>
                {selectedItem.organizer && (
                  <p className="text-sm font-medium text-[#6E6E73] mb-5 flex-shrink-0">
                    by {selectedItem.organizer}
                  </p>
                )}
                
                <p className="text-[#333333] leading-relaxed mb-5 text-sm md:text-base whitespace-pre-wrap">
                  {selectedItem.description || 'Detailed information about this event will go here...'}
                </p>
                
                {(selectedItem.tags && selectedItem.tags.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedItem.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-semibold rounded-md uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 md:px-8 md:py-5 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Total Price</span>
                  <span className="text-xl md:text-2xl font-bold text-[#111111]">
                    {selectedItem.price === 'paid' ? 'Paid' : 'Free'}
                  </span>
                </div>
                
                <SlideButton onComplete={() => {
                  setTimeout(() => {
                    setSelectedItem(null);
                  }, 1000); // Close after showing "Registered!" briefly
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
