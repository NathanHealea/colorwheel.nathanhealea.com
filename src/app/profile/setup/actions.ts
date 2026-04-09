'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getAuthUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export type ProfileSetupState = { error?: string } | null

export async function completeProfileSetup(
  _prevState: ProfileSetupState,
  formData: FormData
): Promise<ProfileSetupState> {
  const authResult = await getAuthUser()

  if (!authResult) {
    redirect('/sign-in')
  }

  const displayName = formData.get('display_name') as string

  if (!displayName || displayName.trim().length === 0) {
    return { error: 'Display name is required' }
  }

  const trimmed = displayName.trim()

  if (trimmed.length < 2 || trimmed.length > 30) {
    return { error: 'Display name must be between 2 and 30 characters' }
  }

  if (trimmed !== displayName) {
    return { error: 'Display name must not have leading or trailing whitespace' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', authResult.user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'This display name is already taken' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
