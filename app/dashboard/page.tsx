"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { Loader2, Plus, Folder, Clock, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardHome() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // ✅ Fetch user's projects
  const {
    data: projectsData,
    isLoading: projectsLoading,
    refetch,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const projects = projectsData?.projects || [];
  const hasProjects = projects.length > 0;

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

      // ✅ Refetch projects and navigate
      await refetch();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-background dark:via-background dark:to-secondary">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300/30 dark:bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/30 dark:bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <MorphingText
            texts={[
              "Welcome to Cortex",
              "Work with Cortex",
              "Manage with Cortex",
              "Collaborate with Cortex",
            ]}
          />
          <p className="text-muted-foreground mt-4">
            {hasProjects
              ? "Select a project to continue or create a new one"
              : "Get started by creating your first project"}
          </p>
        </div>

        {/* Loading State */}
        {projectsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Existing Projects Grid */}
        {!projectsLoading && hasProjects && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {projects.map((project: any) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary"
                onClick={() => router.push(`/dashboard/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                        {project.icon || project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{project._count?.members || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Folder className="w-4 h-4" />
                      <span>{project._count?.pages || 0} pages</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Create New Project Button */}
        <div className="flex justify-center">
          <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerTrigger asChild>
              <ShimmerButton className="shadow-xl">
                <Plus className="w-5 h-5 mr-2" />
                {hasProjects
                  ? "Create New Project"
                  : "Create Your First Project"}
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
                      <span className="text-muted-foreground">(Optional)</span>
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-primary dark:to-purple-500 dark:hover:from-primary/90 dark:hover:to-purple-600 text-white"
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

        {/* Empty State */}
        {!projectsLoading && !hasProjects && (
          <div className="text-center mt-12 text-muted-foreground">
            <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
