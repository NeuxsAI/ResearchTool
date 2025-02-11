"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "AI Researcher at Stanford",
    content: "This tool has revolutionized how I organize my research. The AI-powered insights are incredibly valuable.",
    avatar: "/avatars/sarah.jpg",
  },
  {
    name: "Prof. James Wilson",
    role: "Computer Science, MIT",
    content: "The knowledge graph feature helps me discover connections I would have otherwise missed.",
    avatar: "/avatars/james.jpg",
  },
  {
    name: "Dr. Emily Brown",
    role: "Research Lead at DeepMind",
    content: "An indispensable tool for any serious researcher. The paper management system is seamless.",
    avatar: "/avatars/emily.jpg",
  },
]

export function Testimonials() {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#0000FF]/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#4B0082]/30 rounded-full blur-[120px]" />
      </div>
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
            Trusted by Leading Researchers
          </h2>
          <p className="text-lg text-[#888] max-w-2xl mx-auto">
            Join thousands of researchers who are already using our platform to enhance their research workflow.
          </p>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="bg-[#0A0A0A]/50 border-[#ffffff10] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-[#030014] text-white">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">{testimonial.name}</div>
                    <div className="text-sm text-[#888]">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-[#888]">{testimonial.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 