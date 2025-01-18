"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function EarlyAccess() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([
          { 
            email,
            signed_up_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      toast.success("Thank you for joining the waitlist!")
      setEmail("")
    } catch (error) {
      console.error('Error:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="early-access" className="py-32 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-1/2 -translate-y-1/2 left-1/4 w-[500px] h-[500px] bg-[#4B0082]/30 rounded-full blur-[120px]"
        />
      </div>
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
            Get Early{" "}
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-transparent bg-clip-text">
              Access
            </span>
          </h2>
          <p className="text-lg text-[#888] mb-8">
            Join our waitlist to be among the first to experience the future of research management.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#0A0A0A]/50 border-[#ffffff10] text-white placeholder:text-[#888]"
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 whitespace-nowrap"
            >
              {isLoading ? "Joining..." : "Join Waitlist"}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  )
} 