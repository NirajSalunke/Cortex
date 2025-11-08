"use client";

import { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/Modetoggle";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { Loader2, Trello } from "lucide-react";
import KanbanBoard from "./KanbanBoard";

interface Props {
  projectId: string;
  boardId: string;
}

export function KanbanView({ projectId, boardId }: Props) {
  const { data: boardData, isLoading } = useQuery({
    queryKey: ["board", projectId, boardId],
    queryFn: async () => {
      try {
        console.log(
          `Fetching board data for projectId: ${projectId}, boardId: ${boardId}`
        );
        const res = await fetch(`/api/projects/${projectId}/boards/${boardId}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch board: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ Board data:", data);
        return data;
      } catch (error) {
        console.error("❌ Error fetching board:");
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const roomId = `board-${projectId}-${boardId}`;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="h-16 border-b bg-white dark:bg-background flex items-center justify-between px-2">
          <div className="h-full flex items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-5"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/dashboard/${projectId}`}>
                    Project
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Loading...</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div>
            <ModeToggle />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading board...</p>
          </div>
        </div>
      </div>
    );
  }

  const board = boardData;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 border-b bg-white dark:bg-background flex items-center justify-between px-2">
        <div className="h-full flex items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-5"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/dashboard/${projectId}`}>
                  Project
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2">
                  <Trello className="w-4 h-4" />
                  {board?.name || "Untitled Board"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div>
          <ModeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="p-8">Loading kanban...</div>}>
          <div className="p-8">
            {/* Board Info */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Trello className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold">{board?.name}</h1>
              </div>
              <p className="text-muted-foreground">
                {board?.cards?.length || 0}{" "}
                {board?.cards?.length === 1 ? "task" : "tasks"}
              </p>
            </div>

            <LiveblocksProvider
              throttle={16}
              authEndpoint="/api/liveblocks-auth"
            >
              <RoomProvider id={roomId}>
                <ClientSideSuspense
                  fallback={
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading kanban board...</span>
                    </div>
                  }
                >
                  <KanbanBoard
                    board={board}
                    projectId={projectId}
                    boardId={boardId}
                  />
                </ClientSideSuspense>
              </RoomProvider>
            </LiveblocksProvider>
          </div>
        </Suspense>
      </div>
    </div>
  );
}

export default KanbanView;
