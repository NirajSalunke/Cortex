"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
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
import { Plus, FileText, ChevronRight, Loader2 } from "lucide-react";

export function PagesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPageId = searchParams?.get("page");
  const params = useParams();
  const projectId = (params?.projectId as string) || "";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: pages, refetch } = useQuery({
    queryKey: ["pages", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pages`);
      return res.json();
    },
  });

  const handleCreatePage = async () => {
    if (!title.trim()) {
      alert("Please enter a page title");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), parentId: null }),
      });

      if (!res.ok) throw new Error("Failed to create page");

      const { page } = await res.json();
      await refetch();

      setTitle("");
      setOpen(false);

      router.push(`/dashboard/${projectId}?page=${page.id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating page");
      setIsCreating(false);
    }
  };

  const renderPages = (pages: any[] = [], level = 0) => {
    return pages
      .filter((p) => !p.parentId)
      .map((page) => (
        <div key={page.id}>
          {page.children?.length > 0 ? (
            <Collapsible defaultOpen={false} className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  onClick={() =>
                    router.push(`/dashboard/${projectId}?page=${page.id}`)
                  }
                  className={`${
                    currentPageId === page.id
                      ? "bg-accent text-accent-foreground font-semibold"
                      : ""
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{page.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {page.children.map((child: any) => (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton
                        asChild
                        onClick={() =>
                          router.push(
                            `/dashboard/${projectId}?page=${child.id}`
                          )
                        }
                        className={`${
                          currentPageId === child.id
                            ? "bg-accent text-accent-foreground font-semibold"
                            : ""
                        }`}
                      >
                        <div className="cursor-pointer">
                          <FileText className="w-4 h-4" />
                          <span>{child.title}</span>
                        </div>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() =>
                  router.push(`/dashboard/${projectId}?page=${page.id}`)
                }
                className={`${
                  currentPageId === page.id
                    ? "bg-accent text-accent-foreground font-semibold"
                    : ""
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{page.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </div>
      ));
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Pages</SidebarGroupLabel>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button
              className="p-1 hover:bg-accent rounded transition-colors"
              title="New Page"
            >
              <Plus className="w-4 h-4" />
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <div className="w-full max-w-md mx-auto">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl">Create New Page</DrawerTitle>
                <DrawerDescription>
                  Add a new page to your project.
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-4 px-4">
                <div className="space-y-2">
                  <label
                    htmlFor="page-title"
                    className="text-sm font-medium text-foreground"
                  >
                    Page Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="page-title"
                    placeholder="e.g., Getting Started"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isCreating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCreating && title.trim()) {
                        handleCreatePage();
                      }
                    }}
                    className="bg-background border border-input focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
              </div>

              <DrawerFooter className="flex flex-row gap-3 pt-6">
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    disabled={isCreating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </DrawerClose>
                <Button
                  onClick={handleCreatePage}
                  disabled={isCreating || !title.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-primary dark:to-purple-500 dark:hover:from-primary/90 dark:hover:to-purple-600 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Page
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <SidebarMenu>
        {pages?.pages?.length > 0 ? (
          renderPages(pages.pages)
        ) : (
          <p className="text-sm text-muted-foreground p-2">No pages yet</p>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
