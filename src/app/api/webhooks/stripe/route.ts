import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { apiError, apiSuccess } from '@/lib/api-response'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return apiError('Missing stripe-signature header', 400)
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecret || !webhookSecret) {
    return apiError('Stripe configuration is missing on the server', 500)
  }

  const stripe = new Stripe(stripeSecret)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return apiError(`Webhook Error: ${err.message}`, 400)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.metadata?.workspace_id
        const userId = session.metadata?.user_id
        const customerId = session.customer as string

        if (workspaceId) {
          // Update workspace status to active and store customer ID
          const { error: wsError } = await admin
            .from('workspaces')
            .update({
              plan_status: 'active',
              stripe_customer_id: customerId,
            })
            .eq('id', workspaceId)

          if (wsError) {
            console.error(`Failed to update workspace status: ${wsError.message}`)
          }

          if (userId) {
            const { error: progressError } = await admin
              .from('onboarding_progress')
              .update({
                onboarding_completed: true,
                current_step: 9,
                completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
              })
              .eq('user_id', userId)
              .eq('workspace_id', workspaceId)

            if (progressError) {
              console.error(`Failed to complete onboarding progress: ${progressError.message}`)
            }
          }
        }

        // Reconcile Stripe Checkout session record if it exists in db
        const { error: checkoutError } = await admin
          .from('stripe_checkouts')
          .update({ status: 'succeeded' })
          .eq('session_id', session.id)

        if (checkoutError) {
          console.error(`Failed to update checkout record: ${checkoutError.message}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        if (customerId) {
          // Set plan_status to active for any workspace matching the Stripe customer ID
          const { error: wsError } = await admin
            .from('workspaces')
            .update({ plan_status: 'active' })
            .eq('stripe_customer_id', customerId)

          if (wsError) {
            console.error(`Failed to renew plan status on invoice payment: ${wsError.message}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        if (customerId) {
          // Set plan_status to past_due for workspace matching customer ID
          const { error: wsError } = await admin
            .from('workspaces')
            .update({ plan_status: 'past_due' })
            .eq('stripe_customer_id', customerId)

          if (wsError) {
            console.error(`Failed to update plan status on invoice payment failure: ${wsError.message}`)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (customerId) {
          // Set plan_status to cancelled for workspace matching customer ID
          const { error: wsError } = await admin
            .from('workspaces')
            .update({ plan_status: 'cancelled' })
            .eq('stripe_customer_id', customerId)

          if (wsError) {
            console.error(`Failed to cancel plan status on subscription deletion: ${wsError.message}`)
          }
        }
        break
      }

      default:
        // Other unhandled events
        break
    }

    return apiSuccess({ received: true }, 'Webhook received.')
  } catch (error: any) {
    console.error(`Error processing Stripe webhook event ${event.type}:`, error)
    return apiError(error.message ?? 'Internal Server Error', 500)
  }
}
