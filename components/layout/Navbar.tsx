"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Clubs", href: "#clubs" },
  { label: "About", href: "/about" },
];

export default function Navbar({ initialUser = null, initialRole = "user", initialQrCode = null }: { initialUser?: any, initialRole?: string, initialQrCode?: string | null }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Triggers when user scrolls a bit down (25% of viewport height)
    const onScroll = () => setIsCollapsed(window.scrollY > (window.innerHeight * 0.25));
    
    // Check initial scroll position
    onScroll();
    
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white flex items-center px-4 md:px-6 ${
        isCollapsed ? 'w-[calc(100%-2rem)] md:max-w-[420px]' : 'w-[calc(100%-2rem)] max-w-7xl'
      }`}
      style={{ height: '64px' }}
    >
      <nav className="flex items-center justify-between w-full h-full">
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center font-bold text-xl text-[#111111] hover:opacity-70 transition-all duration-500 overflow-hidden whitespace-nowrap shrink-0 ${
            isCollapsed ? 'max-w-0 opacity-0 -ml-4 pointer-events-none' : 'max-w-[120px] opacity-100'
          }`}
        >
          <span>Cirkkl</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 mx-auto transition-all duration-500">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-[#6E6E73] hover:bg-[#cfe467]/40 hover:text-[#111111]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Buttons */}
        <div 
          className={`hidden md:flex items-center gap-3 transition-all duration-500 overflow-hidden whitespace-nowrap shrink-0 ${
            isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
          }`}
        >
          <ProfileMenu initialUser={initialUser} initialRole={initialRole} initialQrCode={initialQrCode} />
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden shrink-0 h-9 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#111111] hover:bg-[#E5E5EA]/60 transition-all overflow-hidden ${
            isCollapsed ? 'w-0 opacity-0 pointer-events-none -mr-4' : 'w-9 opacity-100'
          }`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileOpen && !isCollapsed && (
        <div
          className="absolute top-20 left-0 right-0 px-6 py-4 flex flex-col gap-2 rounded-2xl bg-white border-[0.5px] border-[#E5E5EA] md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-[#111111] hover:bg-[#E5E5EA]/60 transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 mt-2 justify-center border-t border-[#E5E5EA] pt-4">
            <ProfileMenu initialUser={initialUser} initialRole={initialRole} initialQrCode={initialQrCode} />
          </div>
        </div>
      )}
    </header>
  );
}
