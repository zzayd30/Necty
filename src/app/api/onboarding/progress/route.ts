import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type OnboardingData = Record<string, string | number | string[] | null>

const progressSchema = z.object({
  step: z.number().int().min(1).max(9),
  data: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.array(z.string()), z.null()])
  ),
})

async function getOwnerWorkspaceId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string
) {
  const { data, error } = (await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('accepted', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()) as {
    data: { workspace_id: string } | null
    error: { message: string } | null
  }

  if (error) throw new Error(error.message)
  if (!data?.workspace_id) throw new Error('No owner workspace found for this account.')
  return data.workspace_id
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const workspaceId = await getOwnerWorkspaceId(admin, user.id)
    const { data, error } = (await admin
      .from('onboarding_progress')
      .select('current_step, onboarding_data, onboarding_completed')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()) as {
      data:
        | {
            current_step: number | null
            onboarding_data: OnboardingData | null
            onboarding_completed: boolean | null
          }
        | null
      error: { message: string } | null
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      step: Math.max(1, Math.min(9, data?.current_step ?? 1)),
      data: data?.onboarding_data ?? {},
      completed: Boolean(data?.onboarding_completed),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load onboarding progress.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = progressSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payload.' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const workspaceId = await getOwnerWorkspaceId(admin, user.id)
    const completedSteps = Array.from({ length: parsed.data.step }, (_, i) => i + 1)

    await admin.from('onboarding_progress').upsert(
      {
        user_id: user.id,
        workspace_id: workspaceId,
        current_step: parsed.data.step,
        completed_steps: completedSteps,
        onboarding_completed: false,
        onboarding_data: parsed.data.data,
      },
      { onConflict: 'user_id,workspace_id' }
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save onboarding progress.' },
      { status: 500 }
    )
  }
}
