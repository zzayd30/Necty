import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return NextResponse.json(
      { error: 'You must be logged in to resend verification.' },
      { status: 401 }
    )
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
      return NextResponse.json(
        { error: linkError?.message ?? 'Failed to generate verification link.' },
        { status: 500 }
      )
    }

    await sendVerificationEmail(user.email, linkData.properties.action_link)

    return NextResponse.json({
      message: 'Verification email sent. Check your inbox and spam folder.',
      status: 200,
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend verification email.' },
      { status: 500 }
    )
  }
}
