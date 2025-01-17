"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Brain, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    title: "Paper Management",
    description: "Import and organize research papers with automatic metadata extraction and categorization.",
    icon: BookOpen,
  },
  {
    title: "AI Analysis",
    description: "Extract key insights and summaries from papers using advanced AI models.",
    icon: Brain,
  },
  {
    title: "Knowledge Graph",
    description: "Visualize connections between papers and ideas in an interactive knowledge graph.",
    icon: Sparkles,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export function Features() {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#4B0082]/30 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF0000]/20 rounded-full blur-[120px]"
        />
      </div>
      <div className="container relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 md:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="bg-[#0A0A0A]/50 border-[#ffffff10] backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300">
                <CardHeader>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 0.7 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="h-12 w-12 text-white mb-4" />
                  </motion.div>
                  <CardTitle className="text-xl text-white/90">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-[#888]">
                  {feature.description}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 