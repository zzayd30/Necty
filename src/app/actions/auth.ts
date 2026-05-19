"use server"

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type AuthActionState = {
  error: string | null
}

export type ResendVerificationState = {
  error: string | null
  message: string | null
}

const optionalText = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}, z.string().min(1))

const signupSchema = z.object({
  fullName: optionalText,
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function getFirstIssueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Please check the form and try again.'
}

function getFieldValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawInput = {
    fullName: getFieldValue(formData, 'fullName'),
    email: getFieldValue(formData, 'email'),
    password: getFieldValue(formData, 'password'),
  }

  const parsed = signupSchema.safeParse(rawInput)

  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed.error) }
  }

  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createAdminClient()
    const {
      data: signUpData,
      error: signUpError,
    } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
        },
      },
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    if (!signUpData.user) {
      return {
        error:
          'Unable to initialize your account. Please try again or check your auth email settings.',
      }
    }

    const userId = signUpData.user.id
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
      return { error: workspaceError?.message ?? 'Failed to create workspace.' }
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
      return { error: memberError.message }
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
      return { error: progressError.message }
    }

    await admin.from('profiles').upsert({
      id: userId,
      full_name: parsed.data.fullName,
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Signup failed unexpectedly.',
    }
  }

  redirect('/onboarding')
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  let emailConfirmed = false

  const parsed = loginSchema.safeParse({
    email: getFieldValue(formData, 'email'),
    password: getFieldValue(formData, 'password'),
  })

  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed.error) }
  }

  try {
    const supabase = await createClient()
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: parsed.data.email,
        password: parsed.data.password,
      }
    )

    if (signInError) {
      return { error: signInError.message }
    }

    const userId = signInData.user?.id

    if (!userId) {
      return { error: 'Unable to start a session for this account.' }
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('accepted', true)
      .order('created_at', { ascending: true })
      .limit(1)

    if (membershipError) {
      return { error: membershipError.message }
    }

    if (!memberships?.length) {
      return {
        error: 'No workspace membership was found for this account.',
      }
    }

    emailConfirmed = Boolean(signInData.user?.email_confirmed_at)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Login failed unexpectedly.',
    }
  }

  if (!emailConfirmed) {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resendVerificationAction(
  _previousState: ResendVerificationState
): Promise<ResendVerificationState> {
  void _previousState

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return { error: 'You must be logged in to resend verification.', message: null }
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/onboarding`,
    },
  })

  if (error) {
    return { error: error.message, message: null }
  }

  return {
    error: null,
    message: 'Verification email sent. Check your inbox and spam folder.',
  }
}