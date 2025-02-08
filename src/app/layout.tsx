import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { UserProvider } from "@/lib/context/user-context";
import { CategoriesProvider } from "@/lib/context/categories-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'nexusmind - AI-Powered Research Assistant',
  description: 'Organize research papers, extract insights, and connect ideas using AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gradient-to-b from-background to-muted/30 min-h-screen`}>
        <UserProvider>
          <CategoriesProvider>
            {children}
            <Toaster theme="dark" position="top-center" />
          </CategoriesProvider>
        </UserProvider>
      </body>
    </html>
  );
}
