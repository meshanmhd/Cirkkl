"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { verifyOrgOtpAction, resendOrgOtpAction } from "@/app/actions/auth"

interface VerifyOrgClientProps {
  email: string
}

export function VerifyOrgClient({ email }: VerifyOrgClientProps) {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const formatErrorMessage = (msg: string) => {
    const lower = msg.toLowerCase()
    if (lower.includes("expired")) {
      return "Your code has expired. Please request a new code."
    }
    if (lower.includes("maximum") || lower.includes("attempts") || lower.includes("exceeded")) {
      return "Maximum failed attempts exceeded. Please request a new code."
    }
    if (lower.includes("too many") || lower.includes("rate")) {
      return "Too many requests. Please wait before trying again."
    }
    return msg
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || otp.length !== 6) return

    setLoading(true)
    setError("")
    setNotice("")

    const result = await verifyOrgOtpAction(otp)

    if (result?.error) {
      setError(formatErrorMessage(result.error))
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return

    setResending(true)
    setError("")
    setNotice("")

    const result = await resendOrgOtpAction()
    setResending(false)

    if (result?.error) {
      setError(formatErrorMessage(result.error))
    } else {
      setNotice("A new code has been generated. Your organisation code is provided by the platform admin.")
      setCooldown(60)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-10 bg-white">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-[#111111]">Verify your account</h1>
          <p className="text-balance text-sm text-[#6E6E73]">
            Your organisation code is provided by the platform admin.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="grid gap-4">
            {error && (
              <div className="text-red-500 text-sm font-medium text-center">
                {error}
              </div>
            )}
            {notice && (
              <div className="text-green-600 text-sm font-medium text-center">
                {notice}
              </div>
            )}
            <div className="grid gap-4">
              <label htmlFor="otp" className="text-sm font-medium text-[#111111] text-center">
                Enter the 6-Digit Code
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
            <Button
              type="button"
              variant="outline"
              disabled={resending || cooldown > 0}
              onClick={handleResend}
              className="w-full rounded-xl h-11 text-sm font-medium border-[#E5E5EA] text-[#111111] hover:bg-neutral-50 disabled:opacity-50"
            >
              {cooldown > 0 ? `Request new code (${cooldown}s)` : resending ? "Requesting..." : "Request new code"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
