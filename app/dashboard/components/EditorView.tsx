"use client";

// import { Room } from "@/app/Room";
// import { CollaborativeEditor } from "@/components/CollaborativeEditor";
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

interface Props {
  projectId: string;
  pageId: string;
}

export function EditorView({ projectId, pageId }: Props) {
  const { data: page } = useQuery({
    queryKey: ["page", pageId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pages/${pageId}`);
      return res.json();
    },
  });

  const roomId = `project-${projectId}-page-${pageId}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Breadcrumb */}
      <header className="h-16 border-b bg-white flex items-center px-8">
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
                {page?.page?.title || "Loading..."}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="p-8">Loading editor...</div>}>
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />

          {/* <Room roomId={roomId}>
            <CollaborativeEditor pageId={pageId} projectId={projectId} />
          </Room> */}
        </Suspense>
      </div>
    </div>
  );
}
