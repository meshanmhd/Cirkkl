"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

interface DotQRCodeProps {
  value: string;
  size?: number;
}

export function DotQRCode({ value, size = 200 }: DotQRCodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    qrRef.current = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data: value,
      dotsOptions: {
        color: "#111111",
        type: "dots",
      },
      cornersSquareOptions: {
        color: "#111111",
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#111111",
        type: "dot",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      qrOptions: {
        errorCorrectionLevel: "H",
      },
    });

    if (ref.current) {
      ref.current.innerHTML = "";
      qrRef.current.append(ref.current);
    }
  }, [value, size]);

  return <div ref={ref} style={{ width: size, height: size }} />;
}
