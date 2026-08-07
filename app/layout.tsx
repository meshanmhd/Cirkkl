import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Campus Events — Discover Everything Happening on Your Campus",
  description:
    "Find workshops, hackathons, cultural festivals, sports events, seminars, and club activities all in one place.",
  keywords: ["campus events", "college events", "student activities", "hackathons", "workshops"],
  openGraph: {
    title: "Campus Events",
    description: "Discover everything happening on your campus.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans")}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
