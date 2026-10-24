import { Bell, User } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#E5E5EA] bg-white/80 backdrop-blur-md px-6 md:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-[#6E6E73] hover:text-[#111111] transition-colors rounded-full hover:bg-[#F5F5F7]">
            <span className="sr-only">View notifications</span>
            <Bell className="h-[20px] w-[20px]" strokeWidth={2} aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[#E5E5EA]" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            <button type="button" className="-m-1.5 flex items-center p-1.5 transition-transform hover:scale-105">
              <span className="sr-only">Open user menu</span>
              <div className="h-9 w-9 rounded-[10px] bg-[#F5F5F7] flex items-center justify-center border border-[#E5E5EA] overflow-hidden shadow-sm">
                <User className="h-[18px] w-[18px] text-[#111111]" strokeWidth={2} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
