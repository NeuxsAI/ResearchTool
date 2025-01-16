import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  // If there's no session and the user is not trying to access the login page
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    console.log("test 1!")
    const redirectUrl = request.nextUrl.clone()
    console.log()
    redirectUrl.pathname = '/main'
    return NextResponse.redirect(redirectUrl)
  }

  // If there's a session and the user is trying to access the login page
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    //console.log("test 2!")
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/main'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)'],
} 