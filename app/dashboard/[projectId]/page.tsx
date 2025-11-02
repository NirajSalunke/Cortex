"use client";

import { useSearchParams } from "next/navigation";
import { EditorView } from "../components/EditorView";

interface Props {
  params: { projectId: string };
}

export default function ProjectDashboard({ params }: Props) {
  const searchParams = useSearchParams();
  const pageId = searchParams?.get("page");

  return (
    <div className="flex-1 h-screen">
      {pageId ? (
        <EditorView projectId={params.projectId} pageId={pageId} />
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
