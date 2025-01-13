"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Github, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const supabase = createClient()

  async function signInWithGithub() {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          scopes: 'read:user user:email',
        },
      })
      if (error) throw error
    } catch (error) {
      toast.error("Could not sign in with GitHub")
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function signInWithEmail() {
    if (!email) return

    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      toast.success("Check your email for the login link!")
      setEmail("")
    } catch (error) {
      toast.error("Could not send login link")
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 min-w-[300px]">
      <Button
        variant="outline"
        className="bg-[#1c1c1c] border-[#2a2a2a] hover:bg-[#2a2a2a] text-white relative h-11"
        onClick={signInWithGithub}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Github className="mr-2 h-4 w-4" />
        )}
        Continue with Github
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#2a2a2a]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#121212] px-2 text-[#666]">Or continue with</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#1c1c1c] border-[#2a2a2a] text-white placeholder:text-[#666] h-11"
          disabled={isLoading}
        />
        <Button
          onClick={signInWithEmail}
          disabled={isLoading || !email}
          className="bg-white text-black hover:bg-gray-100 relative h-11"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in with Email
        </Button>
      </div>
      <p className="text-center text-sm text-[#666]">
        You will receive a magic link to sign in
      </p>
    </div>
  )
} 