'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type AuthState = { error?: string; success?: string } | null

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email to confirm your account.' }
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  redirect('/sign-in')
}
