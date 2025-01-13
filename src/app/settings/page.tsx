"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        if (data) setFullName(data.full_name || "");
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    }
    loadProfile();
  }, [user, supabase]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-sm font-medium text-white mb-4">Settings</h1>
        
        <div className="space-y-6 bg-[#1c1c1c] rounded-lg p-6">
          <div>
            <h2 className="text-[11px] font-medium text-[#888] mb-4">Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] text-[#888]">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="h-8 text-[11px] bg-[#2a2a2a] border-[#2a2a2a] text-[#888]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[11px] text-[#888]">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-8 text-[11px] bg-[#2a2a2a] border-[#2a2a2a] text-white placeholder:text-[#666]"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-8 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
              >
                Save Changes
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-[11px] font-medium text-[#888] mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-[11px] text-[#888]">Theme</Label>
                <select
                  id="theme"
                  className="w-full h-8 text-[11px] bg-[#2a2a2a] border-[#2a2a2a] rounded-md text-white px-2 appearance-none"
                  defaultValue="dark"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-medium text-[#888] mb-4">Danger Zone</h2>
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-[11px] text-red-400 hover:text-red-400 bg-[#2a2a2a] p-2"
                onClick={() => toast.error("Account deletion is not implemented yet")}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 