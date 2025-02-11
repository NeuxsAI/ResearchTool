import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

interface FilterSortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: { sortBy: string; categories: string[] }) => void;
  categories: Category[];
  selectedCategories: string[];
}

export function FilterSortDialog({ 
  open, 
  onOpenChange, 
  onApply,
  categories = [], 
  selectedCategories: initialSelectedCategories = [] 
}: FilterSortDialogProps) {
  const [sortBy, setSortBy] = useState("recent");
  const [selectedCategories, setSelectedCategories] = useState(initialSelectedCategories);

  const handleApply = () => {
    onApply({ sortBy, categories: selectedCategories });
    onOpenChange(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest First" },
    { value: "title", label: "Title (A-Z)" },
    { value: "year", label: "Publication Year" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#030014] border-[#2a2a2a] p-6">
        <DialogHeader className="px-0 pb-2">
          <DialogTitle className="text-white flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Filter & Sort
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Categories Section */}
          <div className="space-y-3">
            <Label className="text-[11px] text-[#888] block">Categories</Label>
            <ScrollArea className="h-[120px]">
              <div className="grid grid-cols-2 gap-2 pr-4">
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                    className={`h-7 px-2 text-[11px] cursor-pointer transition-all ${
                      selectedCategories.includes(category.id)
                        ? "bg-[#333] border-[#333] text-white hover:opacity-90"
                        : "bg-transparent border-[#333] text-[#888] hover:text-white hover:bg-[#333]"
                    }`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: category.color || '#666' }}
                      />
                      <span>{category.name}</span>
                      {category.count && category.count > 0 && (
                        <span className="text-[9px] opacity-60">
                          {category.count}
                        </span>
                      )}
                    </div>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Sort Section */}
          <div className="space-y-3">
            <Label className="text-[11px] text-[#888] block -mt-10">Sort by</Label>
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-md text-left text-[11px] transition-all ${
                    sortBy === option.value
                      ? "bg-[#333] text-white"
                      : "text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <Check className="h-3 w-3 ml-1.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedCategories([]);
              setSortBy("recent");
            }}
            className="h-7 px-3 text-[11px] text-[#888] hover:text-white hover:bg-[#333]"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="h-7 px-3 text-[11px] bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 