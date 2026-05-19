import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log("User: ", user) 
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isVerifyEmailRoute = request.nextUrl.pathname.startsWith('/verify-email')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isLoginRoute = request.nextUrl.pathname === '/login'
  const isSignupRoute = request.nextUrl.pathname === '/signup'

  function redirectWithCookies(path: string) {
    const url = request.nextUrl.clone()
    url.pathname = path
    const redirectResponse = NextResponse.redirect(url)
    
    // Copy updated cookies from supabaseResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    
    return redirectResponse
  }

  // 1. If not logged in:
  if (!user) {
    if (isDashboardRoute || isVerifyEmailRoute || isOnboardingRoute) {
      return redirectWithCookies('/login')
    }
    return supabaseResponse
  }

  // 2. If logged in:
  const isConfirmed = Boolean(user.email_confirmed_at)

  // 2a. If not verified (email unconfirmed):
  if (!isConfirmed) {
    if (!isVerifyEmailRoute) {
      return redirectWithCookies('/verify-email')
    }
    return supabaseResponse
  }

  // 2b. If verified:
  // Query onboarding progress and workspace membership
  const { data: progress } = await supabase
    .from('onboarding_progress')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('accepted', true)
    .limit(1)

  const isOnboardingCompleted = Boolean(progress?.onboarding_completed)
  const hasWorkspace = Boolean(memberships && memberships.length > 0)

  if (!isOnboardingCompleted || !hasWorkspace) {
    // If onboarding is incomplete, restrict to /onboarding
    if (isDashboardRoute || isLoginRoute || isSignupRoute || isVerifyEmailRoute) {
      return redirectWithCookies('/onboarding')
    }
  } else {
    // Onboarding is completed, restrict from /onboarding, /verify-email, /login, /signup
    if (isOnboardingRoute || isVerifyEmailRoute || isLoginRoute || isSignupRoute) {
      return redirectWithCookies('/dashboard')
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
