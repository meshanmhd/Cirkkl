"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "relative flex h-11 items-center overflow-hidden bg-background shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-border/50 rounded-[2rem]",
        className
      )}
    >
      <button
        onClick={() => router.back()}
        type="button"
        className="flex h-11 shrink-0 items-center gap-2 rounded-[2rem] px-5 text-[14px] font-medium text-foreground outline-hidden transition-[scale,background-color] duration-150 ease-out focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-foreground active:scale-[0.96] hover:bg-muted/50 cursor-pointer"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Back
      </button>
    </div>
  );
}
