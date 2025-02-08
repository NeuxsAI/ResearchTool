"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getCategories } from "@/lib/supabase/db";
import type { Category } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./user-context";

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
  isLoading: true,
  error: null,
  refreshCategories: async () => {},
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: isUserLoading } = useUser();

  async function refreshCategories() {
    if (!user) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await getCategories();
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      setError("Failed to load categories");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Only load categories when we have confirmed user authentication status
    if (!isUserLoading) {
      refreshCategories();
    }
  }, [isUserLoading, user]);

  return (
    <CategoriesContext.Provider value={{ categories, isLoading, error, refreshCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => {
  return useContext(CategoriesContext);
}; 