'use client';

import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export const SlideButton = ({ onComplete }: { onComplete?: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCompleted) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !thumbRef.current || isCompleted) return;
    const container = containerRef.current.getBoundingClientRect();
    const thumb = thumbRef.current.getBoundingClientRect();
    const maxScroll = container.width - thumb.width - 8; // 4px padding on each side
    
    let newX = e.clientX - container.left - (thumb.width / 2);
    newX = Math.max(0, Math.min(newX, maxScroll));
    
    setPosition(newX);
    
    if (newX >= maxScroll - 5) {
      setIsCompleted(true);
      setIsDragging(false);
      if (onComplete) onComplete();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isCompleted) return;
    setIsDragging(false);
    setPosition(0);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[64px] bg-[#111111] rounded-full flex items-center overflow-hidden touch-none select-none shadow-md border border-black/5"
    >
      <div 
        className="absolute inset-0 flex items-center justify-center text-white/90 text-[16px] font-semibold tracking-wide z-0 ml-8 pointer-events-none transition-opacity duration-200"
        style={{ opacity: isCompleted ? 0 : Math.max(0, 1 - (position / 80)) }}
      >
        Slide to Register
      </div>
      
      {/* Background fill - Left Rectangle to center of thumb */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-[#cfe467] z-0 rounded-l-full"
        style={{ 
          width: `${position + 32}px`,
          transition: isDragging ? 'none' : 'width 0.3s ease'
        }}
      />
      {/* Background fill - Right Circle matching thumb position */}
      <div 
        className="absolute top-0 bottom-0 w-[64px] bg-[#cfe467] z-0 rounded-full"
        style={{ 
          left: `${position}px`,
          transition: isDragging ? 'none' : 'left 0.3s ease'
        }}
      />
      
      {/* Thumb */}
      <div 
        ref={thumbRef}
        className="absolute z-10 left-1 w-[56px] h-[56px] bg-white rounded-full flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing"
        style={{ 
          transform: `translateX(${position}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ArrowRight size={20} className="text-[#111111]" />
      </div>
      
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center text-[#111111] font-bold z-20 animate-fade-in bg-[#cfe467] text-lg">
          Registered!
        </div>
      )}
    </div>
  );
};
