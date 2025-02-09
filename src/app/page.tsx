"use client"

import { Hero } from "@/components/landing/hero"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { motion } from "framer-motion"
import { EarlyAccess } from "@/components/landing/early-access"
import { FilterSortDialog } from "@/components/library/filter-sort-dialog"
import { SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [isFilterSortOpen, setIsFilterSortOpen] = useState(false)

  const handleFilterSort = ({ sortBy }: { sortBy: string }) => {
    // Handle both filtering and sorting here
    let sorted = [...papers]
    
    switch (sortBy) {
      case "recent":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "year":
        sorted.sort((a, b) => b.year - a.year)
        break
    }
    
    setPapers(sorted)
  }

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
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" 
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
      <FilterSortDialog
        open={isFilterSortOpen}
        onOpenChange={setIsFilterSortOpen}
        onApply={handleFilterSort}
      />
    </motion.div>
  )
}