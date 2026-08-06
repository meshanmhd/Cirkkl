import Link from "next/link";
import { MailCheck } from "lucide-react";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#cfe467]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] flex flex-col items-center gap-8 text-center relative z-10">
        
        {/* Icon Container */}
        <div className="w-20 h-20 bg-[#cfe467]/20 rounded-full flex items-center justify-center">
          <MailCheck className="w-10 h-10 text-[#a3b83c]" strokeWidth={2} />
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Check your inbox</h1>
          <p className="text-[#6E6E73] text-[15px] leading-relaxed">
            We've sent a magic link to <br />
            {email ? (
              <span className="font-semibold text-[#111111]">{email}</span>
            ) : (
              "your email address"
            )}
            <br />
            Click the link to securely confirm your account.
          </p>
        </div>

        <div className="w-full space-y-4 pt-4">
          <Link 
            href="/login" 
            className="flex items-center justify-center w-full rounded-2xl bg-[#cfe467] text-[#111111] hover:bg-[#b8cc58] font-bold h-14 text-lg transition-colors"
          >
            Back to Login
          </Link>

          <p className="text-[13px] text-[#6E6E73]">
            Didn't receive it? Check your spam folder.
          </p>
        </div>

      </div>
    </div>
  );
}
