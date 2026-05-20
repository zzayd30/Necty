import { NextResponse } from 'next/server'
import { z } from 'zod'

import { apiError, apiSuccess } from '@/lib/api-response'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = forgotPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid email.', 400)
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()

    // Generate password reset link
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: 'recovery',
        email: parsed.data.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/reset-password`,
        },
      })

    // If link generation fails, return generic message for security
    if (linkError || !linkData?.properties?.action_link) {
      return apiSuccess(
        { message: 'If that email exists, a password reset link has been sent.' },
        'If that email exists, a password reset link has been sent.'
      )
    }

    const resetLink = linkData.properties.action_link

    // Send password reset email
    try {
      await sendPasswordResetEmail(parsed.data.email, resetLink)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return apiError('Failed to send password reset email.', 500)
    }

    return apiSuccess(
      { message: 'Password reset link sent to your email.' },
      'Password reset link sent to your email.'
    )
  } catch (error) {
    return apiError(
      error instanceof Error
        ? error.message
        : 'Failed to process password reset request.',
      500
    )
  }
}