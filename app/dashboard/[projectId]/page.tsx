"use client";

import { useParams, useSearchParams } from "next/navigation";
import { EditorView } from "../components/EditorView";
import KanbanView from "../components/KanbanView";

export default function ProjectDashboard() {
  const searchParams = useSearchParams();
  const pageId = searchParams?.get("page");
  const boardId = searchParams?.get("board");

  const projectId = (useParams()?.projectId as string) || "";

  return (
    <div className="flex-1 h-screen">
      {pageId ? (
        <EditorView projectId={projectId} pageId={pageId} />
      ) : boardId ? (
        <KanbanView projectId={projectId} boardId={boardId} />
      ) : (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-muted">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Welcome</h1>
            <p className="text-muted-foreground">
              Select a page or board from the left sidebar to start
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
