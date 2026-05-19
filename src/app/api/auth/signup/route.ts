import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'

const signupSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = signupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payload.' },
      { status: 400 }
    )
  }

  try {
    const cookieStore = await cookies()

    const authCookies = cookieStore.getAll().filter((c) => c.name.startsWith('sb-'))
    for (const cookie of authCookies) {
      cookieStore.delete(cookie.name)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()

    // 1. Create user WITHOUT sending Supabase email
    const { data: userData, error: userError } =
      await admin.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: false,
        user_metadata: {
          full_name: parsed.data.fullName,
        },
      })

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: userError?.message ?? 'Unable to create user.' },
        { status: 400 }
      )
    }

    const userId = userData.user.id

    // 2. Generate verification link (NO email sent by Supabase)
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: 'signup',
        email: parsed.data.email,
        password: parsed.data.password,
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

    const verificationLink = linkData.properties.action_link

    // 3. Create profile
    await admin.from('profiles').upsert({
      id: userId,
      full_name: parsed.data.fullName,
    })

    // 4. Create workspace
    const defaultWorkspaceName = parsed.data.fullName
      ? `${parsed.data.fullName} Workspace`
      : 'New Workspace'

    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .insert({
        owner_id: userId,
        business_name: defaultWorkspaceName,
        industry: 'Unspecified',
        city: 'Unspecified',
        state: 'Unspecified',
        plan: 'pro',
        plan_status: 'pending',
      })
      .select('id')
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: workspaceError?.message ?? 'Failed to create workspace.' },
        { status: 500 }
      )
    }

    // 5. Add workspace member
    const { error: memberError } = await admin.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
      invited_email: parsed.data.email,
      accepted: true,
    })

    if (memberError) {
      await admin.from('workspaces').delete().eq('id', workspace.id)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    // 6. Onboarding progress
    await admin.from('onboarding_progress').upsert(
      {
        user_id: userId,
        workspace_id: workspace.id,
        current_step: 1,
        completed_steps: [],
        onboarding_completed: false,
        onboarding_data: {},
      },
      { onConflict: 'user_id,workspace_id' }
    )

    // 7. Send verification email using Resend
    const { sendVerificationEmail } = await import('@/lib/email')
    await sendVerificationEmail(parsed.data.email, verificationLink)

    // 8. RETURN redirect
    return NextResponse.json({
      success: true,
      redirectTo: '/verify-email',
      message: 'User created and verification email sent.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed unexpectedly.' },
      { status: 500 }
    )
  }
}