import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
