"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
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

interface Project {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export function ProjectSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [projectName, setProjectName] = React.useState("");
  const [projectDescription, setProjectDescription] = React.useState("");

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      return res.json();
    },
  });

  const currentProjectId = (params?.projectId as string) || "";
  const projects: Project[] = projectsData?.projects || [];
  const activeProject =
    projects.find((p) => p.id === currentProjectId) || projects[0];

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectName("");
      setProjectDescription("");
      setOpen(false);
      router.push(`/dashboard/${data.project.id}`);
    },
    onError: (error) => {
      console.error("Error creating project:", error);
      alert("Error creating project. Please try again.");
    },
  });

  if (!activeProject) {
    return null;
  }

  const handleProjectChange = (projectId: string) => {
    router.push(`/dashboard/${projectId}`);
    router.refresh();
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    createProjectMutation.mutate({
      name: projectName.trim(),
      description: projectDescription.trim(),
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!createProjectMutation.isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        setProjectName("");
        setProjectDescription("");
      }
    }
  };

  const getProjectIcon = (icon?: string) => {
    return icon || "📁";
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm">
                  {getProjectIcon(activeProject.icon)}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeProject.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {projects.length}{" "}
                    {projects.length === 1 ? "project" : "projects"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Projects
              </DropdownMenuLabel>

              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectChange(project.id)}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <div
                    className={`flex size-6 items-center justify-center rounded-md border text-sm ${
                      project.id === currentProjectId
                        ? "bg-blue-100 dark:bg-blue-900 border-blue-300"
                        : ""
                    }`}
                  >
                    {getProjectIcon(project.icon)}
                  </div>
                  <span
                    className={
                      project.id === currentProjectId ? "font-semibold" : ""
                    }
                  >
                    {project.name}
                  </span>
                  {project.id === currentProjectId && (
                    <span className="ml-auto text-xs text-blue-600 dark:text-blue-400">
                      ✓
                    </span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <Drawer open={open} onOpenChange={handleOpenChange}>
                <DrawerTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setOpen(true);
                    }}
                    className="gap-2 p-2 cursor-pointer"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                      <Plus className="size-4" />
                    </div>
                    <span className="font-medium">New Project</span>
                  </DropdownMenuItem>
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
                      {/* Project Name */}
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
                          disabled={createProjectMutation.isPending}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !createProjectMutation.isPending &&
                              projectName.trim()
                            ) {
                              handleCreateProject();
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
                          <span className="text-muted-foreground">
                            (Optional)
                          </span>
                        </label>
                        <Textarea
                          id="project-desc"
                          placeholder="What's this project about?"
                          value={projectDescription}
                          onChange={(e) =>
                            setProjectDescription(e.target.value)
                          }
                          disabled={createProjectMutation.isPending}
                          className="bg-background border border-input min-h-20 resize-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <DrawerFooter className="flex flex-row gap-3 pt-6">
                      <DrawerClose asChild>
                        <Button
                          variant="outline"
                          disabled={createProjectMutation.isPending}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </DrawerClose>
                      <Button
                        onClick={handleCreateProject}
                        disabled={
                          createProjectMutation.isPending || !projectName.trim()
                        }
                        className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-primary dark:to-purple-500 dark:hover:from-primary/90 dark:hover:to-purple-600 text-white"
                      >
                        {createProjectMutation.isPending ? (
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
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
