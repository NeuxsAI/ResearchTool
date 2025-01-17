"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function Hero() {
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
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 px-8"
            >
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="border-[#333] text-white hover:bg-[#ffffff10]"
            >
              <Link href="#">
                Learn More
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 