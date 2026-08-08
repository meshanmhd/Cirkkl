import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Here you can add route protection logic based on user existence or roles later.
  if (user) {
    const role = user.user_metadata?.role;
    const isOtpVerified = user.user_metadata?.is_otp_verified === true;
    const path = request.nextUrl.pathname;
    
    // Organisation routing logic
    if (role === 'org' || role === 'organisation') {
      if (!isOtpVerified && path !== '/verify-org' && path !== '/login' && path !== '/signup') {
        // Not verified yet, lock them out of everything except verify page
        return NextResponse.redirect(new URL('/verify-org', request.url));
      }
      
      if (isOtpVerified && !path.startsWith('/dashboard') && path !== '/pending-approval') {
        // Verified orgs shouldn't be on the landing page, events page, or anywhere else. Redirect to dashboard.
        return NextResponse.redirect(new URL('/dashboard/events', request.url));
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
