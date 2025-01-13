import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const error_code = requestUrl.searchParams.get("error_code")

  // Log all parameters for debugging
  console.log("Auth callback params:", {
    code: code ? "present" : "missing",
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
    const supabase = createClient()
    try {
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      if (sessionError) {
        console.error("Session exchange error:", sessionError)
        throw sessionError
      }
      console.log("Auth success:", { 
        user: data.user?.id ? "present" : "missing",
        session: data.session ? "present" : "missing"
      })
    } catch (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent("Failed to sign in")}`
      )
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
} 