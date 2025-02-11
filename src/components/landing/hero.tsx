"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, BookOpen, Brain } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import supabase from "@/lib/supabase/client"
import { Github } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Smart Paper Management",
    description: "Organize research papers with AI-powered categorization"
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Extract key insights and connect related concepts automatically"
  },
  {
    icon: Sparkles,
    title: "Interactive Notes",
    description: "Create dynamic annotations that link to relevant research"
  }
]

export function Hero() {
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, []) // Remove supabase from dependencies

  const handleGetStarted = () => {
    router.push(session ? '/main' : '/login')
  }

  const scrollToEarlyAccess = () => {
    const element = document.getElementById('early-access')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20">
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center rounded-full border border-[#333] bg-[#030014] px-4 py-1.5 mb-8"
          >
            <span className="text-xs font-medium text-[#888]">
              Now in beta
            </span>
            <span className="ml-3 text-xs font-medium text-white">
              Request early access →
            </span>
          </motion.div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            The engine for{" "}
            <span className="relative">
              <span className="text-blue-500">
                advanced AI
              </span>
              <motion.span
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute bottom-0 left-0 h-[2px] bg-blue-500/50 blur-sm"
              />
              <motion.span
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute bottom-0 left-0 h-px bg-blue-500"
              />
            </span>{" "}
            retrieval
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 max-w-2xl mx-auto text-lg text-[#888] leading-relaxed"
          >
            A modern tool for researchers to manage papers, extract insights, and connect ideas using AI-powered analysis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-wrap gap-4 justify-center"
          >
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="h-12 px-8 bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={scrollToEarlyAccess}
              size="lg" 
              variant="outline" 
              className="h-12 border-[#333] text-white hover:bg-[#ffffff10]"
            >
              Learn More
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-px bg-white/5 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative flex flex-col items-center p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/[0.04] hover:border-white/20 transition duration-300">
                  <feature.icon className="h-8 w-8 text-blue-500 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#888] text-center">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 