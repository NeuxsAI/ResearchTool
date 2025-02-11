"use client";

import { useEffect, useState } from "react";
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
import { NewCategoryDialog } from "@/components/library/new-category-dialog";
import { ProfileMenu } from "@/components/auth/profile-menu";
import { useUser } from "@/lib/context/user-context";
import { useCategories } from "@/lib/context/categories-context";
import { DeleteCategoryDialog } from "@/components/library/delete-category-dialog";
import type { Category } from "@/lib/supabase/types";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const categoriesContext = useCategories();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Show loading state while checking auth
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030014]">
        <div className="text-[#888]">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#030014]">
      {/* Sidebar */}
      <aside className="w-52 border-r border-[#1a1f2e] flex flex-col bg-[#030014]">
        <div className="p-3 border-b border-[#1a1f2e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-white">Nexus</span>
          </div>
          {!isUserLoading && user && <ProfileMenu user={user} />}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-1.5">
            <div className="space-y-0.5">
              <div className="px-2 py-1">
                <span className="text-[11px] font-medium text-[#4a5578]">Tabs</span>
              </div>
              <Button
                variant={pathname === routes.home ? "secondary" : "ghost"}
                className={`
                  w-full justify-start h-6 px-2 text-[11px] font-normal
                  ${pathname === routes.home ? "bg-[#1a1f2e] text-white" : "text-[#4a5578] hover:bg-[#1a1f2e] hover:text-[#4a5578]"}
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
                  ${pathname === routes.recent ? "bg-[#1a1f2e] text-white" : "text-[#4a5578] hover:bg-[#1a1f2e] hover:text-[#4a5578]"}
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
                  ${pathname === routes.readingList ? "bg-[#1a1f2e] text-white" : "text-[#4a5578] hover:bg-[#1a1f2e] hover:text-[#4a5578]"}
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
                  ${pathname === routes.discover ? "bg-[#1a1f2e] text-white" : "text-[#4a5578] hover:bg-[#1a1f2e] hover:text-[#4a5578]"}
                `}
                onClick={() => handleNavigation(routes.discover)}
              >
                <Brain className="mr-2 h-3 w-3" />
                Discover
              </Button>
            </div>

            <div className="mt-3 space-y-0.5">
              <div className="px-2 py-1">
                <span className="text-[11px] font-medium text-[#4a5578]">My library</span>
              </div>
              {!categoriesContext?.isLoading && categoriesContext?.categories?.map((category: Category, index: number) => (
                <div key={category.id} className="group flex items-center">
                  <Button
                    variant={pathname === routes.category.view(category.id) ? "secondary" : "ghost"}
                    className={`
                      flex-1 justify-start h-6 px-4 text-[11px] font-normal
                      ${pathname === routes.category.view(category.id) ? "bg-[#1a1f2e] text-white" : "text-[#4a5578] hover:bg-[#1a1f2e] hover:text-[#4a5578]"}
                    `}
                    onClick={() => handleNavigation(routes.category.view(category.id))}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-1.5 h-1.5 rounded-full mr-2" 
                        style={{ backgroundColor: category.color || '#666' }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </Button>
                  <DeleteCategoryDialog categoryId={category.id} categoryName={category.name} />
                </div>
              ))}
              {categoriesContext?.isLoading && (
                <div className="px-4 py-2">
                  <span className="text-[11px] text-[#666]">Loading categories...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-1.5 border-t border-[#1a1f2e]">
          <NewCategoryDialog />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#030014]">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
} 