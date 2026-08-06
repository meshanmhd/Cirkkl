"use client"

import React, { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signupAction } from "@/app/actions/auth";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, isPending] = useActionState(signupAction, null);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-[#111111]">Create an account</h1>
        <p className="text-balance text-sm text-[#6E6E73]">
          Enter your details below to sign up
        </p>
      </div>
      <form action={formAction} className="flex flex-col gap-6">
        <div className="grid gap-4">
          {state?.error && (
            <div className="text-red-500 text-sm font-medium text-center">
              {state.error}
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-[#111111]">
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              className="h-12 px-4 rounded-xl border-[#E5E5EA] shadow-none focus-visible:ring-0 focus-visible:border-[#111111]"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#111111]">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              className="h-12 px-4 rounded-xl border-[#E5E5EA] shadow-none focus-visible:ring-0 focus-visible:border-[#111111]"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <label htmlFor="password" className="text-sm font-medium text-[#111111]">
                Password
              </label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="h-12 px-4 rounded-xl border-[#E5E5EA] shadow-none focus-visible:ring-0 focus-visible:border-[#111111]"
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-[#cfe467] text-[#111111] hover:bg-[#b8cc58] font-semibold h-12 mt-2 disabled:opacity-50"
          >
            {isPending ? "Signing up..." : "Sign Up"}
          </Button>
        </div>
        <div className="text-center text-sm text-[#6E6E73]">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4 text-[#111111] font-medium">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
