"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/context/user-context";
import supabase from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.error("Error loading profile:", error);
          // If no profile exists, create one
          if (error.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({ id: user.id })
              .single();
            
            if (insertError) throw insertError;
          } else {
            throw error;
          }
        }
        
        if (data) setFullName(data.full_name || "");
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user, supabase]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-5 h-5 border-t-2 border-zinc-500 rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-zinc-100 text-xl font-medium mb-8">Settings</h1>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[#4a5578] text-sm font-medium">Profile</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-xs font-medium text-[#4a5578]">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="h-9 text-sm bg-[#1a1f2e] border-[#2a3142] text-[#4a5578]"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-xs font-medium text-[#4a5578]">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-9 text-sm bg-[#1a1f2e] border-[#2a3142] text-white placeholder:text-[#4a5578]"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 px-4 text-xs font-medium bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-t-2 border-[#4a5578] rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </section>

          {/* Preferences Section */}
          <section className="space-y-6 pt-6 border-t border-[#1a1f2e]">
            <div className="flex items-center justify-between">
              <h2 className="text-[#4a5578] text-sm font-medium">Preferences</h2>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="theme" className="text-xs font-medium text-[#4a5578]">
                Theme
              </Label>
              <select
                id="theme"
                className="w-full h-9 text-sm bg-[#1a1f2e] border-[#2a3142] rounded-md text-white px-3 disable"
                disabled
                defaultValue="dark"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-6 pt-6 border-t border-[#1a1f2e]">
            <div className="flex items-center justify-between">
              <h2 className="text-[#4a5578] text-sm font-medium">Danger Zone</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-red-900/20 rounded-lg">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-white">Delete Account</h3>
                <p className="text-xs text-[#4a5578]">
                  Permanently remove your account and all its data
                </p>
              </div>
              <Button
                variant="destructive"
                className="h-8 px-3 text-xs font-medium bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/20"
                onClick={() => toast.error("Account deletion is not implemented yet")}
              >
                Delete Account
              </Button>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
} 