"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import supabase from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Settings, LogOut, User as UserIcon } from "lucide-react";

interface ProfileMenuProps {
  user: User;
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-5 w-5 rounded-full border border-[#2a2a2a] p-0"
          disabled={isLoading}
        >
          <UserIcon className="h-3 w-3 text-[#888]" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[#030014] border-[#2a2a2a] text-white">
        <DropdownMenuItem
          className="flex items-center text-xs cursor-pointer hover:bg-[#2a2a2a]"
          onClick={() => router.push("/settings")}
        >
          <Settings className="mr-2 h-3.5 w-3.5" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center text-xs cursor-pointer text-red-400 hover:bg-[#2a2a2a] hover:text-red-400"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 