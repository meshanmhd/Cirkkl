import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (user) {
    try {
      const adminClient = createAdminClient()
      const { data: orgData } = await adminClient
        .from('organisations')
        .select('is_approved, is_otp_verified')
        .eq('id', user.id)
        .maybeSingle()

      if (orgData) {
        const isOtpVerified = orgData.is_otp_verified === true
        const isApproved = orgData.is_approved === true

        if (!isOtpVerified) {
          if (path !== '/verify-org' && path !== '/login' && path !== '/signup') {
            return NextResponse.redirect(new URL('/verify-org', request.url))
          }
        } else if (!isApproved) {
          if (path !== '/pending-approval' && path !== '/login' && path !== '/signup') {
            return NextResponse.redirect(new URL('/pending-approval', request.url))
          }
        } else {
          const isUserRoute = path === '/' || path.startsWith('/events') || path === '/profile' || path === '/verify-org' || path === '/pending-approval' || path === '/login' || path === '/signup'
          if (isUserRoute) {
            return NextResponse.redirect(new URL('/dashboard/events', request.url))
          }
        }
      }
    } catch {
      return supabaseResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
