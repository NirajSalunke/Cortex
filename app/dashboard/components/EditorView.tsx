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
// import CollaborativeEditor from "@/components/CollaborativeEditor";
import { ModeToggle } from "@/components/Modetoggle";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import TiptapEditor from "@/components/CollaborativeEditor";

interface Props {
  projectId: string;
  pageId: string;
}

export function EditorView({ projectId, pageId }: Props) {
  const { data: pageData, isLoading } = useQuery({
    queryKey: ["page", projectId, pageId],
    queryFn: async () => {
      try {
        console.log(
          `Fetching page data for projectId: ${projectId}, pageId: ${pageId}`
        );
        const res = await fetch(`/api/projects/${projectId}/pages/${pageId}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch page: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ Page data:", data);
        return data;
      } catch (error) {
        console.error("❌ Error fetching page:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const roomId = `project-${projectId}-page-${pageId}`;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="h-16 border-b bg-white flex items-center justify-between px-2">
          <div className="h-full flex items-center">
            <SidebarTrigger className="" />
            <Separator orientation="vertical" className="" />
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
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  const page = pageData?.page || pageData;

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 border-b bg-white dark:bg-background flex items-center  justify-between px-2">
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
                <BreadcrumbPage>
                  {page?.title || "Untitled Page"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div>
          <ModeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="p-8">Loading editor...</div>}>
          <div className="p-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{page?.title}</h1>
              <p className="text-muted-foreground">
                Created by {page?.author?.name} •{" "}
                {page?.createdAt
                  ? new Date(page.createdAt).toLocaleDateString()
                  : "Unknown date"}
              </p>
            </div>
            <LiveblocksProvider
              throttle={16}
              authEndpoint="/api/liveblocks-auth"
            >
              <RoomProvider id={roomId}>
                <ClientSideSuspense fallback={<div>Loading…</div>}>
                  <TiptapEditor />
                </ClientSideSuspense>
              </RoomProvider>
            </LiveblocksProvider>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
