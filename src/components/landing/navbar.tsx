"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

export function Navbar() {
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
          <span className="text-lg font-medium text-white/90">nexus</span>
          <span className="text-lg font-medium bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-transparent bg-clip-text">mind</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-6"
        >
          <Link 
            href="/research" 
            className="text-sm text-[#888] hover:text-white/90 transition-colors"
          >
            Research
          </Link>
          <Button 
            asChild 
            variant="default" 
            className="bg-white text-black hover:bg-white/90"
          >
            <Link href="/login">Log In</Link>
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  )
} 