"use client"

import { Hero } from "@/components/landing/hero"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { motion } from "framer-motion"
import { EarlyAccess } from "@/components/landing/early-access"

export default function LandingPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#030014] relative flex flex-col"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute top-20 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" 
        />
      </div>
      <div className="relative flex flex-col flex-grow">
        <Navbar />
        <main className="flex-grow flex flex-col justify-between">
          <div className="space-y-20">
            <Hero />
            <EarlyAccess />
          </div>
        </main>
        <Footer />
      </div>
    </motion.div>
  )
}