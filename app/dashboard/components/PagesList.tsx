"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
}

export function PagesList({ projectId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPageId = searchParams?.get("page");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: pages, refetch } = useQuery({
    queryKey: ["pages", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/pages`);
      return res.json();
    },
  });

  const handleCreatePage = async (title: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentId: null }),
      });

      const { page } = await res.json();
      refetch();
      router.push(`/dashboard/${projectId}?page=${page.id}`);
    } catch (error) {
      alert("Error creating page");
    }
  };

  const renderPages = (pages: any[] = [], level = 0) => {
    return pages
      .filter((p) => !p.parentId)
      .map((page) => (
        <div key={page.id}>
          <Button
            onClick={() =>
              router.push(`/dashboard/${projectId}?page=${page.id}`)
            }
            className={`w-full text-left px-4 py-2 rounded hover:bg-gray-100 ${
              currentPageId === page.id
                ? "bg-blue-100 text-blue-700 font-semibold"
                : ""
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            📄 {page.title}
          </Button>
          {page.children?.length > 0 && renderPages(page.children, level + 1)}
        </div>
      ));
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm font-semibold"
        >
          + New Page
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pages?.pages?.length > 0 ? (
          renderPages(pages.pages)
        ) : (
          <p className="text-gray-500 text-sm">No pages yet</p>
        )}
      </div>

      {showCreateModal && (
        <CreatePageModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePage}
        />
      )}
    </div>
  );
}

function CreatePageModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string) => void;
}) {
  const [title, setTitle] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">New Page</h2>
        <input
          type="text"
          placeholder="Page title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => onCreate(title)}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Create
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
