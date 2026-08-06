import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-white">
      <div className="flex flex-col gap-4 p-6 md:p-10 border-r border-[#E5E5EA]">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center font-bold text-xl text-[#111111]">
            Cirkkl
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-gradient-to-br from-white to-[#cfe467]/20 lg:flex flex-col items-center justify-center p-0 overflow-hidden">
        <img src="/navigation.svg" alt="Navigation" className="max-w-md w-full h-auto drop-shadow-2xl z-10" />
        
        {/* Decorative background elements behind image */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#cfe467]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#7B61FF]/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
