"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false }
);

interface LoadingAnimationProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function LoadingAnimation({
  width = 200,
  height = 200,
  className = "",
}: LoadingAnimationProps) {
  const [lottieData, setLottieData] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    fetch("/loading.lottie", { signal: controller.signal })
      .then((res) => res.arrayBuffer())
      .then((buffer) => setLottieData(buffer))
      .catch((err) => {
        // Silently ignore AbortError caused by React Strict Mode unmounting
        if (err.name !== "AbortError") {
          console.error("Failed to load lottie:", err);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div style={{ width, height }}>
        {lottieData && (
          <DotLottieReact
            data={lottieData}
            loop
            autoplay
          />
        )}
      </div>
    </div>
  );
}
