import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

type OnboardingProgressRow = {
  onboarding_completed: boolean | null
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Routes that don't need any authentication checks
  const skipAuthRoutes = ['/api/', '/auth/confirm', '/auth/reset-password']
  const shouldSkipAuthCheck = skipAuthRoutes.some(route => pathname.startsWith(route))

  // If it's a skip-auth route, allow it through
  if (shouldSkipAuthCheck) {
    return NextResponse.next({
      request,
    })
  }

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
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const hasDashboardSessionId = Boolean(request.nextUrl.searchParams.get('session_id'))

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
    if (isDashboardRoute || isOnboardingRoute) {
      return redirectWithCookies('/login')
    }
    return supabaseResponse
  }

  // 2. If logged in:
  const isConfirmed = Boolean(user.email_confirmed_at)
  const isLoginRoute = pathname === '/login'
  const isSignupRoute = pathname === '/signup'
  const isForgotPasswordRoute = pathname === '/forgot-password'
  const isVerifyEmailRoute = pathname === '/verify-email'
  const isAuthRoute = isLoginRoute || isSignupRoute || isForgotPasswordRoute || isVerifyEmailRoute

  // 2a. If not verified (email unconfirmed):
  if (!isConfirmed) {
    // Allow verify-email, but redirect other auth routes to verify-email
    if (isLoginRoute || isSignupRoute || isForgotPasswordRoute) {
      return redirectWithCookies('/verify-email')
    }
    if (isVerifyEmailRoute) {
      return supabaseResponse
    }
    // For other routes, redirect to verify-email
    if (pathname !== '/verify-email') {
      return redirectWithCookies('/verify-email')
    }
    return supabaseResponse
  }

  // 2b. If verified:
  // Query onboarding progress and workspace membership
  // Use the service-role client here so RLS doesn't hide valid workspace rows
  const admin = createAdminClient()

  const { data: progress, error: progressError } = (await admin
    .from('onboarding_progress')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()) as {
      data: OnboardingProgressRow | null
      error: { message: string } | null
    }

  const { data: memberships, error: membershipsError } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('accepted', true)
    .limit(1)

  const isOnboardingCompleted = progress?.onboarding_completed === true
  const hasOnboardingRow = progress !== null && progress !== undefined
  const hasWorkspace = Boolean(memberships && memberships.length > 0)
  // Debugging info: log user's onboarding and workspace state to server logs
  try {
    // eslint-disable-next-line no-console
    console.log('[middleware] user:', { id: user?.id })
    // eslint-disable-next-line no-console
    console.log('[middleware] onboarding_completed, hasWorkspace:', {
      onboarding_completed: progress?.onboarding_completed,
      hasWorkspace: memberships?.length ?? 0,
    })
  } catch (err) {
    // ignore logging errors
  }

  // Additional raw debug output (may expose PII in logs) to diagnose missing rows
  try {
    // eslint-disable-next-line no-console
    console.log('[middleware] raw progress:', { progress, progressError })
    // eslint-disable-next-line no-console
    console.log('[middleware] raw memberships:', { memberships, membershipsError })

    const { data: ownerWorkspaces, error: ownerWorkspaceError } = await admin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)

    // eslint-disable-next-line no-console
    console.log('[middleware] ownerWorkspaces:', { ownerWorkspaces, ownerWorkspaceError })
  } catch (err) {
    // ignore logging errors
  }

  // If onboarding is not completed or the onboarding row does not exist yet,
  // restrict protected routes to onboarding.
  if (!isOnboardingCompleted) {
    if (isDashboardRoute && hasDashboardSessionId) {
      return supabaseResponse
    }

    if (isDashboardRoute) {
      return redirectWithCookies('/onboarding')
    }
    // Redirect auth routes to onboarding for confirmed users
    if (isAuthRoute) {
      return redirectWithCookies('/onboarding')
    }
    return supabaseResponse
  }

  // Onboarding is completed — restrict /onboarding and auth routes.
  if (isOnboardingRoute) {
    return redirectWithCookies('/dashboard')
  }

  // Prevent authenticated users from accessing auth pages
  if (isAuthRoute) {
    return redirectWithCookies('/dashboard')
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
