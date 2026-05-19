import fs from 'node:fs'
import path from 'node:path'

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const contents = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'))
loadEnvFile(path.resolve(process.cwd(), '.env.local'))

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
]

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is required.`)
  }
}

const PRODUCT_CODE = 'NECTY_PRO_MONTHLY'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function ensureDbProduct() {
  const { data: existing, error: existingError } = await supabase
    .from('subscription_products')
    .select('*')
    .eq('code', PRODUCT_CODE)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return existing
  }

  const { data: inserted, error: insertError } = await supabase
    .from('subscription_products')
    .insert({
      code: PRODUCT_CODE,
      name: 'NECTY Pro',
      description: 'NECTY Pro monthly subscription',
      currency: 'usd',
      unit_amount_cents: 19999,
      recurring_interval: 'month',
      is_active: true,
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    throw insertError ?? new Error('Failed to seed subscription_products row.')
  }

  return inserted
}

async function ensureStripeProduct(dbProduct) {
  if (dbProduct.stripe_product_id) {
    try {
      const product = await stripe.products.retrieve(dbProduct.stripe_product_id)
      if (!product.deleted) {
        return product.id
      }
    } catch {
      // continue to recreate
    }
  }

  const product = await stripe.products.create({
    name: dbProduct.name,
    description: dbProduct.description ?? undefined,
    metadata: {
      app_code: dbProduct.code,
    },
  })

  return product.id
}

async function ensureStripePrice(dbProduct, stripeProductId) {
  if (dbProduct.stripe_price_id) {
    try {
      const price = await stripe.prices.retrieve(dbProduct.stripe_price_id)
      if (price.active) {
        return price.id
      }
    } catch {
      // continue to recreate
    }
  }

  const prices = await stripe.prices.list({
    product: stripeProductId,
    active: true,
    limit: 100,
  })

  const existing = prices.data.find(
    (price) =>
      price.currency === dbProduct.currency &&
      price.unit_amount === dbProduct.unit_amount_cents &&
      price.recurring?.interval === dbProduct.recurring_interval
  )

  if (existing) {
    return existing.id
  }

  const created = await stripe.prices.create({
    product: stripeProductId,
    currency: dbProduct.currency,
    unit_amount: dbProduct.unit_amount_cents,
    recurring: {
      interval: dbProduct.recurring_interval,
    },
    metadata: {
      app_code: dbProduct.code,
    },
  })

  return created.id
}

async function main() {
  const dbProduct = await ensureDbProduct()
  const stripeProductId = await ensureStripeProduct(dbProduct)
  const stripePriceId = await ensureStripePrice(dbProduct, stripeProductId)

  const { error: updateError } = await supabase
    .from('subscription_products')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      is_active: true,
    })
    .eq('id', dbProduct.id)

  if (updateError) {
    throw updateError
  }

  console.log('Seeded Stripe product successfully')
  console.log({
    code: dbProduct.code,
    stripe_product_id: stripeProductId,
    stripe_price_id: stripePriceId,
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
