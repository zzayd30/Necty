import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Unable to initialize your account. Please try again.' },
        { status: 400 }
      )
    }

    const userId = data.user.id
    const defaultWorkspaceName = parsed.data.fullName
      ? `${parsed.data.fullName} Workspace`
      : 'New Workspace'

    const { data: workspace, error: workspaceError } = (await admin
      .from('workspaces')
      .insert({
        owner_id: userId,
        business_name: defaultWorkspaceName,
        industry: 'Unspecified',
        plan: 'pro',
        plan_status: 'pending',
      })
      .select('id')
      .single()) as {
      data: { id: string } | null
      error: { message: string } | null
    }

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: workspaceError?.message ?? 'Failed to create workspace.' },
        { status: 500 }
      )
    }

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

    const { error: progressError } = await admin.from('onboarding_progress').upsert(
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

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    await admin.from('profiles').upsert({
      id: userId,
      full_name: parsed.data.fullName,
    })

    return NextResponse.json({ redirectTo: '/onboarding' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed unexpectedly.' },
      { status: 500 }
    )
  }
}
