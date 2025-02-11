import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/main"
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const error_code = requestUrl.searchParams.get("error_code")

  // Log all parameters for debugging
  console.log("Auth callback params:", {
    code: code ? "present" : "missing",
    redirectTo,
    error,
    error_code,
    error_description,
    url: request.url
  })

  // If there's an error, redirect to login with error message
  if (error) {
    console.error("Auth error details:", {
      error,
      error_code,
      error_description,
      url: request.url
    })
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || "")}`
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    try {
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      if (sessionError) {
        console.error("Session exchange error:", sessionError)
        throw sessionError
      }

      // Verify session was created
      const { data: { session } } = await supabase.auth.getSession()
      console.log("Auth callback success:", { 
        user: data.user?.id ? "present" : "missing",
        session: session ? "present" : "missing",
        sessionId: session?.access_token ? "present" : "missing"
      })

      if (!session) {
        throw new Error("No session established after code exchange")
      }

      // Successful auth - redirect to the intended destination
      const response = NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
      
      // Set cookie to indicate successful auth
      response.cookies.set('auth-callback-success', 'true', { 
        maxAge: 30,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      return response
    } catch (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent("Failed to sign in")}`
      )
    }
  }

  // If no code and no error, redirect to main page
  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
} 