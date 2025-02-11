"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCategories } from "@/lib/supabase/db";
import type { Category } from "@/lib/supabase/types";
import supabase from "@/lib/supabase/client";
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

  const refreshCategories = useCallback(async (showLoading = false) => {
    if (!user) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
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
  }, [user]);

  useEffect(() => {
    if (!isUserLoading) {
      refreshCategories(true);
    }
  }, [isUserLoading, refreshCategories]);

  // Set up real-time subscription for categories
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshCategories(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshCategories]);

  return (
    <CategoriesContext.Provider value={{ 
      categories, 
      isLoading,
      error, 
      refreshCategories: () => refreshCategories(true) 
    }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => {
  return useContext(CategoriesContext);
}; 