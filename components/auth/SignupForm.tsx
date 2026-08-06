"use client"

import React, { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signupAction } from "@/app/actions/auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, isPending] = useActionState(signupAction, null);
  const [role, setRole] = useState("user");
  const [passwordError, setPasswordError] = useState("");
  const [isFading, setIsFading] = useState(false);

  // Handle role change with fade animation
  const handleRoleChange = (newRole: string) => {
    if (newRole === role) return;
    setIsFading(true);
    setTimeout(() => {
      setRole(newRole);
      setIsFading(false);
    }, 200); // 200ms fade duration
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    setPasswordError("");
    // Append the role to the form data
    formData.append("role", role);
    
    // We have to call the form action directly with the formData
    // But since useActionState's formAction takes formData, we can just call it
    // Wait, in React 19 useActionState, the action is passed to the form, or we can invoke it manually.
    // The easiest way is to use a hidden input for the role, and let the form submit normally!
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 
          className={cn(
            "text-2xl font-bold text-[#111111] transition-opacity duration-200", 
            isFading ? "opacity-0" : "opacity-100"
          )}
        >
          Sign Up as {role === 'user' ? 'a' : 'an'}{" "}
          <span className="text-[#cfe467]">{role === 'user' ? 'Member' : 'Organisation'}</span>
        </h1>
        <p className="text-balance text-sm text-[#6E6E73]">
          Enter your details below to sign up
        </p>
      </div>

      {/* Custom Sliding Tab Switcher */}
      <div className="relative flex w-full h-12 bg-[#F5F5F7] rounded-xl p-1 shadow-inner">
        <div 
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out"
          style={{ transform: role === 'user' ? 'translateX(0)' : 'translateX(100%)' }}
        />
        <button
          type="button"
          onClick={() => handleRoleChange("user")}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center text-sm font-medium transition-colors duration-300 rounded-lg",
            role === "user" ? "text-[#111111]" : "text-[#6E6E73] hover:text-[#111111]"
          )}
        >
          Member
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange("org")}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center text-sm font-medium transition-colors duration-300 rounded-lg",
            role === "org" ? "text-[#111111]" : "text-[#6E6E73] hover:text-[#111111]"
          )}
        >
          Organisation
        </button>
      </div>

      <form 
        action={formAction} 
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          const formData = new FormData(e.currentTarget);
          if (formData.get("password") !== formData.get("confirmPassword")) {
            e.preventDefault();
            setPasswordError("Passwords do not match");
          } else {
            setPasswordError("");
          }
        }}
      >
        <input type="hidden" name="role" value={role} />
        
        <div className="grid gap-4">
          {(state?.error || passwordError) && (
            <div className="text-red-500 text-sm font-medium text-center">
              {passwordError || state?.error}
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-[#111111] transition-opacity duration-200">
              <span className={cn(isFading ? "opacity-0" : "opacity-100")}>
                {role === 'user' ? 'Full Name' : 'Organisation Name'}
              </span>
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
          <div className="grid gap-2">
            <div className="flex items-center">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#111111]">
                Confirm Password
              </label>
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
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
