"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [supabase])

  const scrollToEarlyAccess = () => {
    const element = document.getElementById('early-access')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full border-b border-[#ffffff10] bg-[#030014]/80 backdrop-blur-sm z-50"
    >
      <div className="container flex h-16 items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-medium bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">Nexus</span>
          </Link>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-6"
        >
          <button 
            onClick={scrollToEarlyAccess}
            className="text-sm text-[#888] hover:text-white/90 transition-colors"
          >
            Early Access
          </button>
          <Button 
            onClick={() => router.push(session ? '/main' : '/login')}
            variant="default" 
            className="bg-white text-black hover:bg-white/90"
          >
            {session ? 'Dashboard' : 'Log In'}
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  )
} 