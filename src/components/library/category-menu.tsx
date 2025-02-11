"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditCategoryDialog } from "./edit-category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import type { Category } from "@/lib/supabase/types";

interface CategoryMenuProps {
  category: Category;
}

export function CategoryMenu({ category }: CategoryMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-[#1a1f2e]"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3 text-[#4a5578]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-[#030014] border-[#1a1f2e]"
        onClick={(e) => e.stopPropagation()}
      >
        <EditCategoryDialog
          categoryId={category.id}
          initialName={category.name}
          initialSummary={category.summary}
          trigger={
            <DropdownMenuItem 
              className="text-[11px] text-[#4a5578] hover:text-white focus:text-white hover:bg-[#1a1f2e] focus:bg-[#1a1f2e]"
              onSelect={(e) => e.preventDefault()}
            >
              Edit category
            </DropdownMenuItem>
          }
        />
        <DeleteCategoryDialog
          categoryId={category.id}
          categoryName={category.name}
          trigger={
            <DropdownMenuItem 
              className="text-[11px] text-red-500 hover:text-red-400 focus:text-red-400 hover:bg-[#1a1f2e] focus:bg-[#1a1f2e]"
              onSelect={(e) => e.preventDefault()}
            >
              Delete category
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 