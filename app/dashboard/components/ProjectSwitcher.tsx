"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Folder } from "lucide-react";
import { useRouter } from "next/navigation";
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

interface Project {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Props {
  currentProjectId: string;
}

export function ProjectSwitcher({ currentProjectId }: Props) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");

  // Fetch all projects
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      return res.json();
    },
  });

  const projects: Project[] = projectsData?.projects || [];
  const activeProject =
    projects.find((p) => p.id === currentProjectId) || projects[0];

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: "" }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/dashboard/${data.project.id}`);
      setShowCreateModal(false);
      setNewProjectName("");
    },
  });

  if (!activeProject) {
    return null;
  }

  const handleProjectChange = (projectId: string) => {
    router.push(`/dashboard/${projectId}`);
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate(newProjectName);
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
                    {projects.length} projects
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
                        ? "bg-blue-100 border-blue-300"
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
                    <span className="ml-auto text-xs text-blue-600">✓</span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowCreateModal(true)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium">New Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>

            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
                if (e.key === "Escape") setShowCreateModal(false);
              }}
              className="w-full border border-gray-300 px-3 py-2 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName("");
                }}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={
                  createProjectMutation.isPending || !newProjectName.trim()
                }
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
