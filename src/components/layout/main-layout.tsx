"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Library, 
  BookOpen, 
  FileText, 
  Brain, 
  Network, 
  HardDrive, 
  Plus,
  ChevronDown,
  Search,
  Trash,
  Home
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { routes } from "@/app/routes";
import { mockSidebarCategories } from "@/lib/store/mock-data";
import { NewCategoryDialog } from "@/components/library/new-category-dialog";

interface MainLayoutProps {
  children: React.ReactNode;
}

const gradients = [
  'from-blue-500 to-purple-500',
  'from-green-500 to-blue-500',
  'from-yellow-500 to-red-500',
  'from-pink-500 to-purple-500',
  'from-indigo-500 to-blue-500',
  'from-red-500 to-pink-500',
  'from-purple-500 to-indigo-500',
  'from-orange-500 to-red-500',
  'from-teal-500 to-green-500',
  'from-cyan-500 to-blue-500',
];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex h-screen bg-[#1c1c1c]">
      {/* Sidebar */}
      <aside className="w-52 border-r border-[#2a2a2a] flex flex-col bg-[#1c1c1c]">
        <div className="p-2 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-medium px-2 text-[#888]">My Library</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#666]" />
            <Input 
              placeholder="Search..." 
              className="h-6 pl-7 text-[11px] bg-[#2a2a2a] border-[#333] placeholder:text-[#666]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-1.5">
            <div className="space-y-0.5">
              <div className="px-2 py-1">
                <span className="text-[11px] font-medium text-[#666]">Tabs</span>
              </div>
              <Button
                variant={pathname === routes.home ? "secondary" : "ghost"}
                className={`
                  w-full justify-start h-6 px-2 text-[11px] font-normal
                  ${pathname === routes.home ? "bg-[#2a2a2a] text-white" : "text-[#888] hover:bg-[#2a2a2a] hover:text-[#888]"}
                `}
                onClick={() => handleNavigation(routes.home)}
              >
                <Home className="mr-2 h-3 w-3" />
                Home
              </Button>
              <Button
                variant={pathname === routes.recent ? "secondary" : "ghost"}
                className={`
                  w-full justify-start h-6 px-2 text-[11px] font-normal
                  ${pathname === routes.recent ? "bg-[#2a2a2a] text-white" : "text-[#888] hover:bg-[#2a2a2a] hover:text-[#888]"}
                `}
                onClick={() => handleNavigation(routes.recent)}
              >
                <BookOpen className="mr-2 h-3 w-3" />
                Recent
              </Button>
              <Button
                variant={pathname === routes.readingList ? "secondary" : "ghost"}
                className={`
                  w-full justify-start h-6 px-2 text-[11px] font-normal
                  ${pathname === routes.readingList ? "bg-[#2a2a2a] text-white" : "text-[#888] hover:bg-[#2a2a2a] hover:text-[#888]"}
                `}
                onClick={() => handleNavigation(routes.readingList)}
              >
                <FileText className="mr-2 h-3 w-3" />
                Reading list
              </Button>
              <Button
                variant={pathname === routes.discover ? "secondary" : "ghost"}
                className={`
                  w-full justify-start h-6 px-2 text-[11px] font-normal
                  ${pathname === routes.discover ? "bg-[#2a2a2a] text-white" : "text-[#888] hover:bg-[#2a2a2a] hover:text-[#888]"}
                `}
                onClick={() => handleNavigation(routes.discover)}
              >
                <Brain className="mr-2 h-3 w-3" />
                Discover
              </Button>
            </div>

            <div className="mt-3 space-y-0.5">
              <div className="px-2 py-1">
                <span className="text-[11px] font-medium text-[#666]">My library</span>
              </div>
              {mockSidebarCategories.map((category, index) => (
                <Button
                  key={category.id}
                  variant={pathname === routes.category.view(category.id) ? "secondary" : "ghost"}
                  className={`
                    w-full justify-between h-6 px-2 text-[11px] font-normal group
                    ${pathname === routes.category.view(category.id) ? "bg-[#2a2a2a] text-white" : "text-[#888] hover:bg-[#2a2a2a] hover:text-[#888]"}
                  `}
                  onClick={() => handleNavigation(routes.category.view(category.id))}
                >
                  <div className="flex items-center">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} mr-2`} />
                    <span>{category.name}</span>
                  </div>
                  {category.count > 0 && (
                    <span className="text-[#666]">{category.count}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-1.5 border-t border-[#2a2a2a]">
          <NewCategoryDialog />
          <Button 
            variant="ghost" 
            className="w-full justify-start h-6 px-2 text-[11px] font-normal text-[#666] hover:bg-[#2a2a2a] hover:text-[#666]"
          >
            <Trash className="mr-2 h-3 w-3" />
            Trash
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#1c1c1c]">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
} 