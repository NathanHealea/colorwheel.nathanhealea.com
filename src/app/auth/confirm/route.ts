import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * PKCE token hash verification endpoint for email-based auth flows.
 *
 * Verifies the OTP token hash from Supabase email links (e.g. password reset),
 * establishes a session, and redirects to the specified `next` URL.
 * On failure, redirects to `/sign-in` with an error query param.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${request.nextUrl.origin}/sign-in?error=Could not verify your request. Please try again.`
  )
}
