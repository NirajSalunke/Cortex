"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MorphingText } from "@/components/ui/morphing-text";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Loader2, Plus } from "lucide-react";

export default function DashboardHome() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create project");

      const { project } = await res.json();

      setProjectName("");
      setProjectDescription("");
      setOpen(false);

      router.push(`/dashboard/${project.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating project.");
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        setProjectName("");
        setProjectDescription("");
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-background dark:via-background dark:to-secondary">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300/30 dark:bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/30 dark:bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-screen flex flex-col gap-2 justify-center items-center">
        <div className="w-full">
          <MorphingText
            texts={[
              "Welcome to Cortex",
              "Work with Cortex",
              "Manage with Cortex",
              "Collaborate with Cortex",
            ]}
          />
        </div>

        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            <ShimmerButton>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </ShimmerButton>
          </DrawerTrigger>

          <DrawerContent>
            <div className="w-full max-w-md mx-auto">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl">
                  Create New Project
                </DrawerTitle>
                <DrawerDescription>
                  Start collaborating with your team instantly
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-4 px-4">
                <div className="space-y-2">
                  <label
                    htmlFor="project-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Product Design"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !isLoading &&
                        projectName.trim()
                      ) {
                        handleCreate();
                      }
                    }}
                    className="bg-background border border-input focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="project-desc"
                    className="text-sm font-medium text-foreground"
                  >
                    Description{" "}
                    <span className="text-slate-400">(Optional)</span>
                  </label>
                  <Textarea
                    id="project-desc"
                    placeholder="What's this project about?"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    disabled={isLoading}
                    className="bg-background border border-input min-h-20 resize-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <DrawerFooter className="flex flex-row gap-3 pt-6">
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </DrawerClose>
                <Button
                  onClick={handleCreate}
                  disabled={isLoading || !projectName.trim()}
                  className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-primary dark:to-purple-500 dark:hover:from-primary/90 dark:hover:to-purple-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
