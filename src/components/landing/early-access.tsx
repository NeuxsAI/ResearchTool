"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"

const benefits = [
  "Early access to AI-powered research tools",
  "Priority feature requests and feedback",
  "Exclusive beta testing opportunities",
  "Direct access to the development team"
]

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
    <section className="py-32">
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative p-8 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(to bottom right, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.8))",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(51, 51, 51, 0.5)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            
            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
                  Get Early{" "}
                  <span className="relative">
                    <span className="text-blue-500">
                      Access
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
                  </span>
                </h2>
                <p className="text-lg text-[#888] mb-8">
                  Join our waitlist to be among the first to experience the future of research management.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-12">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-[#0A0A0A]/50 border-[#333] text-white placeholder:text-[#666] focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-12 bg-[#2a2a2a] hover:bg-[#333] text-white whitespace-nowrap px-8"
                >
                  {isLoading ? "Joining..." : "Join Waitlist"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-[#888]">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 