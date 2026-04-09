import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Refresh the auth session to keep it alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Paths that should skip profile-setup redirect
  const skipPaths = ['/profile/setup', '/auth/', '/sign-in', '/sign-up', '/sign-up/confirm', '/_next/']
  const shouldSkip = skipPaths.some((p) => pathname.startsWith(p))

  if (user && !shouldSkip) {
    // Check if user still has the default Painter#### display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    if (profile?.display_name && /^Painter\d{4}$/.test(profile.display_name)) {
      const setupUrl = request.nextUrl.clone()
      setupUrl.pathname = '/profile/setup'
      return NextResponse.redirect(setupUrl)
    }
  }

  if (!user && pathname === '/profile/setup') {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = '/sign-in'
    return NextResponse.redirect(signInUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
