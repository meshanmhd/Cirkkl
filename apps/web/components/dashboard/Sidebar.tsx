"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, Info, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "About", href: "/dashboard/about", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-60 hidden md:flex flex-col bg-white border-r border-[#E5E5EA]">
      <div className="flex flex-col h-full">
        <div className="h-[56px] flex items-center px-6 border-b border-[#E5E5EA]">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-[20px] font-bold tracking-tight text-[#111111] font-geist">Cirkkl Hub</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200",
                  isActive
                    ? "text-[#111111]"
                    : "text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7]"
                )}
                style={isActive ? { background: "linear-gradient(135deg, #cfe467 0%, #c8de58 100%)" } : {}}
              >
                <Icon
                  className={cn("shrink-0 transition-colors duration-200", isActive ? "text-[#111111]" : "text-[#9E9EA7] group-hover:text-[#111111]")}
                  style={{ width: "18px", height: "18px" }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-[#E5E5EA] pt-3">
          <Link
            href="/dashboard/settings"
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200",
              pathname.startsWith("/dashboard/settings")
                ? "text-[#111111]"
                : "text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7]"
            )}
            style={pathname.startsWith("/dashboard/settings") ? { background: "linear-gradient(135deg, #cfe467 0%, #c8de58 100%)" } : {}}
          >
            <Settings
              className={cn("shrink-0 transition-all duration-500 group-hover:rotate-90", pathname.startsWith("/dashboard/settings") ? "text-[#111111]" : "text-[#9E9EA7] group-hover:text-[#111111]")}
              style={{ width: "18px", height: "18px" }}
              strokeWidth={pathname.startsWith("/dashboard/settings") ? 2.2 : 1.8}
            />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
