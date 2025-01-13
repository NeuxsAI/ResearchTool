"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getCategories } from "@/lib/supabase/db";
import type { Category } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function refreshCategories() {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await getCategories();
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshCategories();
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, isLoading, error, refreshCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => {
  return useContext(CategoriesContext);
}; 