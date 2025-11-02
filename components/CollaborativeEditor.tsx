"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";

interface Props {
  pageId: string;
  projectId: string;
}

export function CollaborativeEditor({ pageId, projectId }: Props) {
  const room = useRoom();
  const self = useSelf();
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);

  // Initialize Yjs and Liveblocks provider
  useEffect(() => {
    const newDoc = new Y.Doc();
    const newProvider = new LiveblocksYjsProvider(room as any, newDoc);

    setYDoc(newDoc);
    setProvider(newProvider);

    return () => {
      newProvider.destroy();
      newDoc.destroy();
    };
  }, [room]);

  // Initialize editor only after provider is ready
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false, // Disable local history, Yjs handles it
        }),
        Collaboration.configure({
          document: yDoc || undefined,
        }),
        CollaborationCursor.configure({
          provider: provider || undefined,
          user: {
            name: self?.info?.name || "Anonymous",
            color: self?.info?.color || "#3b82f6",
          },
        }),
      ],
      content: "", // Start with empty content
      editable: self?.info?.role
        ? ["OWNER", "ADMIN", "EDITOR"].includes(self.info.role)
        : false,
    },
    [provider, yDoc, self?.info?.role, self?.info?.name]
  );

  // Show loading state
  if (!provider || !yDoc) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collaborative editor...</p>
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing editor...</p>
        </div>
      </div>
    );
  }

  const isReadOnly = !["OWNER", "ADMIN", "EDITOR"].includes(
    self?.info?.role || ""
  );

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="border-b bg-gray-50 p-3 flex gap-2 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className="px-3 py-2 rounded bg-white border hover:bg-gray-100 disabled:opacity-50"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className="px-3 py-2 rounded bg-white border hover:bg-gray-100 disabled:opacity-50"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className="px-3 py-2 rounded bg-white border hover:bg-gray-100"
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className="px-3 py-2 rounded bg-white border hover:bg-gray-100"
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="px-3 py-2 rounded bg-white border hover:bg-gray-100"
          title="Bullet List"
        >
          • List
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-8 focus:outline-none"
        />
      </div>

      {/* Read-only Badge */}
      {isReadOnly && (
        <div className="border-t bg-yellow-50 p-4 text-center">
          <p className="text-sm text-yellow-800 font-medium">
            📖 You have view-only access to this page
          </p>
        </div>
      )}

      {/* Presence Info */}
      <div className="border-t bg-gray-50 p-3 text-xs text-gray-600">
        <p>
          Role: <strong>{self?.info?.role || "Unknown"}</strong> | User:{" "}
          <strong>{self?.info?.name || "Anonymous"}</strong>
        </p>
      </div>
    </div>
  );
}
