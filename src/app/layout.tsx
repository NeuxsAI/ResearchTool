import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Research Tool",
  description: "A modern research tool for organizing and analyzing academic papers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gradient-to-b from-background to-muted/30 min-h-screen`}>
        {children}
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  );
}
