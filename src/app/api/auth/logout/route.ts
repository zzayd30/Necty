import { createClient } from '@/lib/supabase/server'
import { apiSuccess } from '@/lib/api-response'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return apiSuccess({ ok: true, redirectTo: '/login' }, 'Logged out successfully.')
}
