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
import { Plus, Trello, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BoardsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBoardId = searchParams?.get("board");
  const params = useParams();
  const projectId = (params?.projectId as string) || "";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: boards,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["boards", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/boards`);
      if (!res.ok) throw new Error("Failed to fetch boards");
      return res.json();
    },
  });

  const handleCreateBoard = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Please enter a board name");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          columns: ["To Do", "In Progress", "Done"],
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create board");
      }

      const { board } = await res.json();
      await refetch();

      setTitle("");
      setOpen(false);
      setError(null);

      router.push(`/dashboard/${projectId}?board=${board.id}`);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Error creating board");
      setIsCreating(false);
    }
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Boards</SidebarGroupLabel>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button
              className="p-1 hover:bg-accent rounded transition-colors"
              title="New Board"
            >
              <Plus className="w-4 h-4" />
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <div className="w-full max-w-md mx-auto">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl">Create New Board</DrawerTitle>
                <DrawerDescription>
                  Add a new kanban board to your project.
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-4 px-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="board-title"
                    className="text-sm font-medium text-foreground"
                  >
                    Board Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="board-title"
                    placeholder="e.g., Sprint 1, Product Roadmap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isCreating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCreating && title.trim()) {
                        handleCreateBoard();
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
                  onClick={handleCreateBoard}
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
                      Create Board
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <SidebarMenu>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : boards && boards.length > 0 ? (
          boards.map((board: any) => (
            <SidebarMenuItem key={board.id}>
              <SidebarMenuButton
                onClick={() =>
                  router.push(`/dashboard/${projectId}?board=${board.id}`)
                }
                className={`${
                  currentBoardId === board.id
                    ? "bg-accent px-2 py-6 text-accent-foreground font-semibold"
                    : "p-2"
                }`}
              >
                <Trello className="w-4 h-4" />
                <div className="flex-1">
                  <span className="block">{board.name}</span>
                  <span className="text-xs text-muted-foreground block">
                    {board.cards?.length || 0} cards
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        ) : (
          <p className="text-sm text-muted-foreground p-2">No boards yet</p>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
