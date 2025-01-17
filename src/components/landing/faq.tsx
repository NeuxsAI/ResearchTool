"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "framer-motion"
import Link from "next/link"

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "How does the AI analysis work?",
    answer: "Our advanced AI system processes your research papers using state-of-the-art natural language processing. It automatically extracts key insights, identifies main concepts, and creates connections between different papers in your library.",
    value: "item-1",
  },
  {
    question: "Can I integrate with other research tools?",
    answer: "Yes! We support seamless integration with popular reference managers like Zotero, Mendeley, and EndNote. You can import papers using BibTeX, RIS, and other common formats.",
    value: "item-2",
  },
  {
    question: "How secure is my research data?",
    answer: "Security is our top priority. All data is encrypted both in transit and at rest using industry-standard protocols. We employ strict access controls and regular security audits to ensure your research remains private and protected.",
    value: "item-3",
  },
  {
    question: "What file formats are supported?",
    answer: "We support PDF files for papers, along with common reference formats like BibTeX and RIS. Our system can automatically extract metadata, citations, and full text from most academic PDFs.",
    value: "item-4",
  },
  {
    question: "Is there a limit to how many papers I can analyze?",
    answer: "Our standard plan includes generous limits that work for most researchers. For those with larger libraries or specific needs, our professional plans offer expanded capabilities.",
    value: "item-5",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
}

export function FAQ() {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#4B0082]/30 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FF0000]/20 rounded-full blur-[120px]"
        />
      </div>
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-transparent bg-clip-text">
              Questions
            </span>
          </h2>
          <p className="text-lg text-[#888] max-w-2xl mx-auto">
            Everything you need to know about nexusmind and how it can transform your research workflow.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQList.map(({ question, answer, value }) => (
              <motion.div key={value} variants={itemVariants}>
                <AccordionItem
                  value={value}
                  className="border-b-0 bg-[#0A0A0A]/50 backdrop-blur-sm rounded-lg px-4"
                >
                  <AccordionTrigger 
                    className="text-white hover:text-white/90 hover:no-underline py-4 transition-all text-left"
                  >
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#888] pb-4">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          <motion.div 
            variants={itemVariants}
            className="text-center mt-8"
          >
            <h3 className="text-[#888]">
              Still have questions?{" "}
              <Link
                href="/contact"
                className="text-white hover:text-white/90 transition-colors border-b border-transparent hover:border-white/20"
              >
                Contact us
              </Link>
            </h3>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}