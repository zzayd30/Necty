import { cookies } from 'next/headers'
import { z } from 'zod'

import { apiError, apiSuccess } from '@/lib/api-response'
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
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload.', 400)
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
      return apiError(error.message, 400)
    }

    const userId = data.user?.id
    if (!userId) {
      return apiError('Unable to start a session for this account.', 400)
    }

    // 1. Check if the account is verified (email confirmed)
    if (!data.user?.email_confirmed_at) {
      return apiSuccess({
        redirectTo: '/verify-email',
      }, 'Email verification required.')
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
      return apiError(progressError.message, 500)
    }
    console.log('[login] onboarding progress', { progress }) // Debug log
    const onboardingCompleted = progress?.onboarding_completed ?? false
    if (!onboardingCompleted) {
      return apiSuccess({
        redirectTo: '/onboarding',
      }, 'Onboarding required.')
    }

    // 3. Check if workspace is created
    const { data: memberships, error: membershipError } = await admin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .limit(1)

    if (membershipError) {
      return apiError(membershipError.message, 500)
    }

    if (!memberships?.length) {
      return apiSuccess({
        redirectTo: '/onboarding',
      }, 'Onboarding required.')
    }

    return apiSuccess({
      redirectTo: '/dashboard',
    }, 'Login successful.')
  } catch (error) {
    return apiError(error instanceof Error ? error.message : 'Login failed unexpectedly.', 500)
  }
}
