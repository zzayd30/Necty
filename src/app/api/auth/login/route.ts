import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

type OnboardingProgressRow = {
  onboarding_completed: boolean | null
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payload.' },
      { status: 400 }
    )
  }

  try {
    const cookieStore = await cookies()
    // Clear any existing stale auth cookies to prevent "Invalid Refresh Token" error
    const authCookies = cookieStore.getAll().filter((c) => c.name.startsWith('sb-'))
    for (const cookie of authCookies) {
      cookieStore.delete(cookie.name)
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const userId = data.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to start a session for this account.' },
        { status: 400 }
      )
    }

    // 1. Check if the account is verified (email confirmed)
    if (!data.user?.email_confirmed_at) {
      return NextResponse.json({
        redirectTo: '/verify-email',
      })
    }

    // 2. Check if onboarding is completed
    const admin = createAdminClient()

    const { data: progress, error: progressError } = (await admin
      .from('onboarding_progress')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .maybeSingle()) as {
        data: OnboardingProgressRow | null
        error: { message: string } | null
      }

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }
    console.log('[login] onboarding progress', { progress }) // Debug log
    const onboardingCompleted = progress?.onboarding_completed ?? false
    if (!onboardingCompleted) {
      return NextResponse.json({
        redirectTo: '/onboarding',
      })
    }

    // 3. Check if workspace is created
    const { data: memberships, error: membershipError } = await admin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .limit(1)

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 })
    }

    if (!memberships?.length) {
      return NextResponse.json({
        redirectTo: '/onboarding',
      })
    }

    return NextResponse.json({
      redirectTo: '/dashboard',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed unexpectedly.' },
      { status: 500 }
    )
  }
}
