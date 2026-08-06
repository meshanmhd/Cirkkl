'use client';

import React, { useEffect, useRef } from 'react';

interface DotFieldProps {
  color?: string;
  dotSize?: number;
  dotSpacing?: number;
  className?: string;
}

export function DotField({
  color = '#cfe467',
  dotSize = 2,
  dotSpacing = 24,
  className = '',
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      time += 0.02;
      const rect = canvas.getBoundingClientRect();
      const clientWidth = rect.width;
      const clientHeight = rect.height;
      ctx.clearRect(0, 0, clientWidth, clientHeight);

      const rows = Math.ceil(clientHeight / dotSpacing) + 1;
      const cols = Math.ceil(clientWidth / dotSpacing) + 1;

      ctx.fillStyle = color;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let posX = x * dotSpacing;
          let posY = y * dotSpacing;

          // Mouse interaction (bulge effect)
          const dx = mouseX - posX;
          const dy = mouseY - posY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 200; // Increased interaction radius
          
          let offsetX = 0;
          let offsetY = 0;
          let currentDotSize = dotSize;
          
          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            const angle = Math.atan2(dy, dx);
            // Push away from mouse
            offsetX = -Math.cos(angle) * force * 30; // Increased push force
            offsetY = -Math.sin(angle) * force * 30;
            // Scale up dots near mouse, but keep them smaller than before
            currentDotSize = dotSize + (force * dotSize * 1);
          }

          // Simple wave animation baseline
          const waveX = Math.sin(posX * 0.01 + time) * 1.5;
          const waveY = Math.cos(posY * 0.01 + time) * 1.5;

          ctx.beginPath();
          ctx.arc(posX + waveX + offsetX, posY + waveY + offsetY, currentDotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, dotSize, dotSpacing]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
}
