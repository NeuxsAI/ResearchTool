"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { BookCopy } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    if (error) {
      toast.error(decodeURIComponent(error))
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030014] px-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-[#030014] p-2">
            <BookCopy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Welcome to Research Tool
          </h1>
          <p className="text-sm text-[#888]">
            Sign in to organize and analyze your research papers
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
} 