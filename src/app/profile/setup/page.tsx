import { redirect } from 'next/navigation'

import { getAuthUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import ProfileSetupForm from './profile-form'

export default async function ProfileSetupPage() {
  const authResult = await getAuthUser({ withProfile: true })

  if (!authResult) {
    redirect('/sign-in')
  }

  const { user, profile } = authResult

  // If display name does not match the default Painter#### pattern, setup is already complete
  if (profile?.display_name && !/^Painter\d{4}$/.test(profile.display_name)) {
    redirect('/')
  }

  // Read suggested display name from OAuth provider metadata
  const metadata = user.user_metadata ?? {}
  const suggestedName = metadata.full_name || metadata.name || metadata.custom_username || undefined

  // Check if suggested name is already taken
  let nameAlreadyTaken = false
  if (suggestedName) {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id').ilike('display_name', suggestedName).single()

    nameAlreadyTaken = !!data
  }

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <ProfileSetupForm suggestedName={suggestedName} nameAlreadyTaken={nameAlreadyTaken} />
    </div>
  )
}
