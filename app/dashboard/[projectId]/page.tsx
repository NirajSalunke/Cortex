"use client";

import { useParams, useSearchParams } from "next/navigation";
import { EditorView } from "../components/EditorView";

export default function ProjectDashboard() {
  const searchParams = useSearchParams();
  const pageId = searchParams?.get("page");
  console.log(useParams());
  const projectId = (useParams()?.projectId as string) || "";

  return (
    <div className="flex-1 h-screen">
      {pageId ? (
        <EditorView projectId={projectId} pageId={pageId} />
      ) : (
        <div className="flex items-center justify-center h-full bg-linear-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome</h1>
            <p className="text-gray-600">
              Select a page from the left sidebar to start editing:
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
