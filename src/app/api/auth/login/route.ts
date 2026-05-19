import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payload.' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const userId = data.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to start a session for this account.' },
        { status: 400 }
      )
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .order('created_at', { ascending: true })
      .limit(1)

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 })
    }

    if (!memberships?.length) {
      return NextResponse.json(
        { error: 'No workspace membership was found for this account.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      redirectTo: data.user?.email_confirmed_at ? '/dashboard' : '/onboarding',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed unexpectedly.' },
      { status: 500 }
    )
  }
}
