"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function Hero() {
  const [session, setSession] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [supabase])

  const handleGetStarted = () => {
    router.push(session ? '/main' : '/login')
  }

  const scrollToEarlyAccess = () => {
    const element = document.getElementById('early-access')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl">
            The engine for{" "}
            <span className="bg-gradient-to-r from-purple-500 via-red-500 to-blue-500 text-transparent bg-clip-text">
              advanced AI
            </span>{" "}
            retrieval
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-lg text-[#888]">
            A modern tool for researchers to manage papers, extract insights, and connect ideas using AI-powered analysis.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 px-8"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={scrollToEarlyAccess}
              size="lg" 
              variant="outline" 
              className="border-[#333] text-white hover:bg-[#ffffff10]"
            >
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 