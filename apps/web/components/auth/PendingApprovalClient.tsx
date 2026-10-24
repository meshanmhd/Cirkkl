"use client"

import { useState } from "react"
import { Hourglass, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function PendingApprovalClient() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRefresh = () => {
    setLoading(true)
    router.refresh()
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#cfe467]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] flex flex-col items-center gap-8 text-center relative z-10">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
          <Hourglass className="w-10 h-10 text-amber-500" strokeWidth={2} />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Pending Approval</h1>
          <p className="text-[#6E6E73] text-[15px] leading-relaxed px-4">
            Your account is now under review. We'll notify you by email as soon as it's approved. In the meantime, please check back later for access.
          </p>
        </div>

        <div className="w-full space-y-4 pt-4 flex justify-center">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="ghost"
            className="rounded-full text-[#6E6E73] hover:text-[#111111] hover:bg-[#F5F5F7] transition-colors flex items-center gap-2 px-4 py-2 h-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{loading ? 'Checking...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
