import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { apiError, apiSuccess } from '@/lib/api-response'

const resetPasswordSchema = z.object({
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = resetPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('Password must be at least 8 characters long.', 400)
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Get the current user (authenticated with recovery token from email link)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      return apiError(
        'Invalid or expired password reset link. Please request a new one.',
        400
      )
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    })

    if (updateError) {
      return apiError(
        updateError.message ?? 'Failed to update password.',
        400
      )
    }

    // Sign out the user (since their session was via recovery token)
    await supabase.auth.signOut()

    return apiSuccess(
      {},
      'Password updated successfully. Please log in with your new password.'
    )
  } catch (error) {
    return apiError(
      error instanceof Error
        ? error.message
        : 'Failed to reset password.',
      500
    )
  }
}
