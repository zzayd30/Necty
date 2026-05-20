import { apiError, apiSuccess } from '@/lib/api-response'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function GET() {
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
      return apiError(error.message, 500)
    }

    return apiSuccess({ product: data }, 'Active billing product loaded.')
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Unable to load billing product.',
      500
    )
  }
}
