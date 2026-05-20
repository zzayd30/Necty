import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/email'
import { apiError, apiSuccess } from '@/lib/api-response'
import { z } from 'zod'

const resendVerificationSchema = z.object({
  email: z.string().email().optional(),
})

export async function POST(request: Request) {
  // Try to get body (optional - for email parameter)
  let body: any = null
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const parsed = resendVerificationSchema.safeParse(body)
  const emailFromBody = parsed.data?.email

  // If email is provided in body, use it (for unauthenticated users)
  if (emailFromBody) {
    try {
      const admin = createAdminClient()
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: emailFromBody,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/confirm`,
        },
      })

      if (linkError || !linkData?.properties?.action_link) {
        return apiError(linkError?.message ?? 'Failed to generate verification link.', 500)
      }

      await sendVerificationEmail(emailFromBody, linkData.properties.action_link)

      return apiSuccess(
        { message: 'Verification email sent. Check your inbox and spam folder.' },
        'Verification email sent. Check your inbox and spam folder.'
      )
    } catch (error) {
      return apiError(
        error instanceof Error ? error.message : 'Failed to resend verification email.',
        500
      )
    }
  }

  // Otherwise, try to get email from authenticated user session
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return apiError('You must be logged in to resend verification.', 401)
  }

  try {
    const admin = createAdminClient()
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/confirm`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      return apiError(linkError?.message ?? 'Failed to generate verification link.', 500)
    }

    await sendVerificationEmail(user.email, linkData.properties.action_link)

    return apiSuccess(
      { message: 'Verification email sent. Check your inbox and spam folder.' },
      'Verification email sent. Check your inbox and spam folder.'
    )
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Failed to resend verification email.',
      500
    )
  }
}
