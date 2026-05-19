import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type SubscriptionProduct = {
  id: string
  name: string
  description: string | null
  currency: string
  unit_amount_cents: number
  recurring_interval: 'day' | 'week' | 'month' | 'year'
  stripe_price_id: string | null
}

type ActiveSubscriptionProduct = Omit<SubscriptionProduct, 'stripe_price_id'> & {
  stripe_price_id: string
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

async function getActiveProduct(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any
): Promise<ActiveSubscriptionProduct> {
  const { data, error } = (await admin
    .from('subscription_products')
    .select('id, name, description, currency, unit_amount_cents, recurring_interval, stripe_price_id')
    .eq('code', 'NECTY_PRO_MONTHLY')
    .eq('is_active', true)
    .maybeSingle()) as {
    data: SubscriptionProduct | null
    error: { message: string } | null
  }

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No active billing product found.')
  if (!data.stripe_price_id) {
    throw new Error('Product is missing Stripe price id. Run the Stripe seeder first.')
  }

  return data as ActiveSubscriptionProduct
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = finalSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid onboarding payload' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const workspaceId = await getOwnerWorkspaceId(admin, user.id)
    const product = await getActiveProduct(admin)

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
      subscription_product_id: product.id,
      plan: 'pro',
      plan_status: 'pending',
    }

    const { error: wsErr } = await admin.from('workspaces').update(payload).eq('id', workspaceId)
    if (wsErr) throw new Error(wsErr.message)

    await admin.from('onboarding_progress').upsert(
      {
        user_id: user.id,
        workspace_id: workspaceId,
        current_step: 9,
        completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        onboarding_completed: true,
        onboarding_data: body,
      },
      { onConflict: 'user_id,workspace_id' }
    )

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      await admin.from('workspaces').update({ plan_status: 'active' }).eq('id', workspaceId)
      return NextResponse.json({ redirectTo: '/dashboard' })
    }

    const stripe = new Stripe(stripeSecret)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
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

    if (checkoutErr) throw new Error(checkoutErr.message)

    return NextResponse.json({ redirectTo: session.url ?? '/dashboard' })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to finalize onboarding.',
      },
      { status: 500 }
    )
  }
}
