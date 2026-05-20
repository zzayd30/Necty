import { z } from 'zod'

import { apiError, apiSuccess } from '@/lib/api-response'
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

async function getOrCreateWorkspaceId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  email: string,
  fullName?: string
) {
  const { data, error } = (await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('accepted', true)
    .limit(1)
    .maybeSingle()) as {
      data: { workspace_id: string } | null
      error: { message: string } | null
    }

  if (error) throw new Error(error.message)
  if (data?.workspace_id) {
    return data.workspace_id
  }

  // Workspace doesn't exist, let's create it!
  const defaultWorkspaceName = fullName
    ? `${fullName} Workspace`
    : 'New Workspace'

  const { data: workspace, error: workspaceError } = (await admin
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
    .single()) as {
      data: { id: string } | null
      error: { message: string } | null
    }

  if (workspaceError || !workspace) {
    throw new Error(workspaceError?.message ?? 'Failed to create workspace.')
  }

  // Add workspace member
  const { error: memberError } = await admin.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
    invited_email: email,
    accepted: true,
  })

  if (memberError) {
    await admin.from('workspaces').delete().eq('id', workspace.id)
    throw new Error(memberError.message)
  }

  // Initialize onboarding progress
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
    throw new Error(progressError.message)
  }

  return workspace.id
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return apiError('Not authenticated', 401)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const workspaceId = await getOrCreateWorkspaceId(
      admin,
      user.id,
      user.email ?? '',
      profile?.full_name
    )

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
      return apiError(error.message, 500)
    }

    return apiSuccess(
      {
        step: Math.max(1, Math.min(9, data?.current_step ?? 1)),
        data: data?.onboarding_data ?? {},
        completed: Boolean(data?.onboarding_completed),
      },
      'Onboarding progress loaded.'
    )
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Unable to load onboarding progress.',
      500
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = progressSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload.', 400)
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return apiError('Not authenticated', 401)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const workspaceId = await getOrCreateWorkspaceId(
      admin,
      user.id,
      user.email ?? '',
      profile?.full_name
    )

    const { data: existingProgress, error: existingProgressError } = (await admin
      .from('onboarding_progress')
      .select('current_step, onboarding_data')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()) as {
        data:
        | {
          current_step: number | null
          onboarding_data: OnboardingData | null
        }
        | null
        error: { message: string } | null
      }

    if (existingProgressError) {
      throw new Error(existingProgressError.message)
    }

    const incomingDataIsEmpty = Object.keys(parsed.data.data).length === 0

    if (
      parsed.data.step === 1 &&
      incomingDataIsEmpty &&
      ((existingProgress?.current_step ?? 0) > 1 ||
        (existingProgress?.onboarding_data &&
          Object.keys(existingProgress.onboarding_data).length > 0))
    ) {
      return apiSuccess({ ok: true }, 'Onboarding progress already exists.')
    }

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

    // Update workspaces table with matching onboarding data
    const wsUpdate: Record<string, any> = {}
    const obData = parsed.data.data

    if (obData.business_name !== undefined) wsUpdate.business_name = obData.business_name
    if (obData.industry !== undefined) wsUpdate.industry = obData.industry
    if (obData.custom_industry !== undefined) wsUpdate.custom_industry = obData.custom_industry
    if (obData.city !== undefined) wsUpdate.city = obData.city
    if (obData.state !== undefined) wsUpdate.state = obData.state

    if (obData.service_area_radius !== undefined) {
      wsUpdate.service_area_mi = obData.service_area_radius
        ? Number(obData.service_area_radius)
        : null
    }

    if (obData.competitors_to_monitor !== undefined) {
      const val = obData.competitors_to_monitor
      wsUpdate.competitors_to_monitor = typeof val === 'string'
        ? val.split(',').map((s) => s.trim()).filter(Boolean)
        : Array.isArray(val) ? val : null
    }

    if (obData.platforms !== undefined) {
      const val = obData.platforms
      wsUpdate.platforms = typeof val === 'string'
        ? val.split(',').map((s) => s.trim()).filter(Boolean)
        : Array.isArray(val) ? val : null
    }

    if (obData.default_offer !== undefined) wsUpdate.default_offer = obData.default_offer
    if (obData.booking_link !== undefined) wsUpdate.booking_link = obData.booking_link
    if (obData.preferred_tone !== undefined) wsUpdate.preferred_tone = obData.preferred_tone
    if (obData.run_frequency !== undefined) wsUpdate.run_frequency = obData.run_frequency

    if (Object.keys(wsUpdate).length > 0) {
      await admin.from('workspaces').update(wsUpdate).eq('id', workspaceId)
    }

    return apiSuccess({ ok: true }, 'Onboarding progress saved.')
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Unable to save onboarding progress.',
      500
    )
  }
}
