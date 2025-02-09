"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="pt-16 pb-12">
      <div className="container">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">Nexus</span>
          </div>
          <p className="text-sm text-[#888]">
            &copy; {new Date().getFullYear()} Nexus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 