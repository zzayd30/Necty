"use server"

import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type OnboardingData = Record<string, string | number | string[] | null>
type FormValue = string
type SubscriptionProduct = {
  id: string
  code: string
  name: string
  description: string | null
  currency: string
  unit_amount_cents: number
  recurring_interval: 'day' | 'week' | 'month' | 'year'
  stripe_price_id: string | null
}

const finalSchema = z.object({
  business_name: z.string().min(1),
  client_name: z.string().min(1),
  industry: z.string().min(1),
  custom_industry: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  service_area_radius: z.string().optional(),
  competitors_to_monitor: z.string().optional(),
  platforms: z.string().optional(),
  default_offer: z.string().optional(),
  booking_link: z.string().url().optional(),
  preferred_tone: z.string().optional(),
  run_frequency: z.string().optional(),
})

async function getOwnerWorkspaceId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string
) {
  const { data: membership, error: membershipError } = (await admin
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

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!membership?.workspace_id) {
    throw new Error('No owner workspace found for this account.')
  }

  return membership.workspace_id
}

export async function loadOnboardingProgress(): Promise<{
  step: number
  data: OnboardingData
  completed: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { step: 1, data: {}, completed: false, error: 'Not authenticated' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const workspaceId = await getOwnerWorkspaceId(admin, user.id)

    const { data: progress, error: progressError } = (await admin
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

    if (progressError) {
      return { step: 1, data: {}, completed: false, error: progressError.message }
    }

    return {
      step: Math.max(1, Math.min(9, progress?.current_step ?? 1)),
      data: progress?.onboarding_data ?? {},
      completed: Boolean(progress?.onboarding_completed),
      error: null,
    }
  } catch (error) {
    return {
      step: 1,
      data: {},
      completed: false,
      error: error instanceof Error ? error.message : 'Unable to load onboarding progress.',
    }
  }
}

export async function saveOnboardingProgress(step: number, data: OnboardingData) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = createAdminClient()
  const workspaceId = await getOwnerWorkspaceId(admin, user.id)
  const completedSteps = Array.from(
    { length: Math.max(1, Math.min(9, step)) },
    (_, i) => i + 1
  )

  await admin.from('onboarding_progress').upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      current_step: Math.max(1, Math.min(9, step)),
      completed_steps: completedSteps,
      onboarding_completed: false,
      onboarding_data: data,
    },
    { onConflict: 'user_id,workspace_id' }
  )
}

export async function getActiveSubscriptionProduct(): Promise<{
  product: SubscriptionProduct | null
  error: string | null
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const { data, error } = (await admin
      .from('subscription_products')
      .select(
        'id, code, name, description, currency, unit_amount_cents, recurring_interval, stripe_price_id'
      )
      .eq('code', 'NECTY_PRO_MONTHLY')
      .eq('is_active', true)
      .maybeSingle()) as {
      data: SubscriptionProduct | null
      error: { message: string } | null
    }

    if (error) {
      return { product: null, error: error.message }
    }

    return { product: data, error: null }
  } catch (error) {
    return {
      product: null,
      error: error instanceof Error ? error.message : 'Unable to load billing product.',
    }
  }
}

export async function finalizeOnboarding(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const raw: Record<string, FormValue> = {}
  formData.forEach((v, k) => (raw[k] = typeof v === 'string' ? v : String(v)))

  const parsed = finalSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Invalid onboarding payload' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return { error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = createAdminClient()
  const workspaceId = await getOwnerWorkspaceId(admin, user.id)
  const { product, error: productError } = await getActiveSubscriptionProduct()

  if (productError || !product) {
    return { error: productError ?? 'No active billing product found.' }
  }

  const payload = {
    business_name: parsed.data.business_name,
    industry: parsed.data.industry,
    custom_industry: parsed.data.custom_industry ?? null,
    city: parsed.data.city,
    state: parsed.data.state,
    service_area_mi: parsed.data.service_area_radius
      ? Number(parsed.data.service_area_radius)
      : null,
    competitors_to_monitor: parsed.data.competitors_to_monitor
      ? parsed.data.competitors_to_monitor.split(',').map((s) => s.trim())
      : null,
    platforms: parsed.data.platforms
      ? parsed.data.platforms.split(',').map((s) => s.trim())
      : null,
    default_offer: parsed.data.default_offer ?? null,
    booking_link: parsed.data.booking_link ?? null,
    preferred_tone: parsed.data.preferred_tone ?? null,
    run_frequency: parsed.data.run_frequency ?? null,
  }

  const { error: wsErr } = await admin.from('workspaces').update(payload).eq('id', workspaceId)

  if (wsErr) {
    throw new Error(wsErr?.message ?? 'Failed to update workspace')
  }

  await admin.from('onboarding_progress').upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      current_step: 9,
      completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      onboarding_completed: true,
      onboarding_data: raw,
    },
    { onConflict: 'user_id,workspace_id' }
  )

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    await admin.from('workspaces').update({ plan_status: 'active' }).eq('id', workspaceId)
    redirect('/dashboard')
  }

  const stripe = new Stripe(stripeSecret)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: product.stripe_price_id
      ? [{ price: product.stripe_price_id, quantity: 1 }]
      : [
          {
            price_data: {
              currency: product.currency,
              product_data: {
                name: product.name,
                description: product.description ?? undefined,
              },
              unit_amount: product.unit_amount_cents,
              recurring: { interval: product.recurring_interval },
            },
            quantity: 1,
          },
        ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/onboarding`,
    metadata: {
      workspace_id: workspaceId,
      user_id: user.id,
      product_id: product.id,
    },
  })

  const { error: checkoutErr } = await admin.from('stripe_checkouts').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    session_id: session.id,
    status: 'created',
    amount: product.unit_amount_cents,
    currency: product.currency,
  })

  if (checkoutErr) {
    throw new Error(checkoutErr.message)
  }

  if (session.url) {
    redirect(session.url)
  }

  redirect('/dashboard')
}


