"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { verifyOrgOtpAction } from "@/app/actions/auth"

interface VerifyOrgClientProps {
  email: string
}

export function VerifyOrgClient({ email }: VerifyOrgClientProps) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || otp.length !== 6) return

    setLoading(true)
    setError("")

    const result = await verifyOrgOtpAction(otp)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-10 bg-white">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-[#111111]">Verify your account</h1>
          <p className="text-balance text-sm text-[#6E6E73]">
            To access your dashboard, we need to verify it's you.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="grid gap-4">
            {error && (
              <div className="text-red-500 text-sm font-medium text-center">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <label htmlFor="otp" className="text-sm font-medium text-[#111111] text-center">
                Enter the 6-Digit Code assigned by the Admin
              </label>
              <div className="flex justify-center w-full">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-12 h-14 text-lg rounded-md border border-[#E5E5EA]" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-lg rounded-md border border-[#E5E5EA]" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-lg rounded-md border border-[#E5E5EA]" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-lg rounded-md border border-[#E5E5EA]" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-lg rounded-md border border-[#E5E5EA]" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-lg rounded-md border border-[#E5E5EA]" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-[#cfe467] text-[#111111] hover:bg-[#b8cc58] font-semibold h-12 mt-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
