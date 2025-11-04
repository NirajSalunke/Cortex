"use client";

import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import { useThreads } from "@liveblocks/react";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Redo2,
  Undo2,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  MoreVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const editorStyles = `
  .ProseMirror {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
    min-height: 400px;
  }

  .ProseMirror:focus {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  .ProseMirror:focus-visible {
    outline: none !important;
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
    font-style: italic;
  }

  .ProseMirror ul {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
    padding: 0;
  }

  .ProseMirror ul li {
    margin-bottom: 0.5rem;
    list-style-position: outside;
  }

  .ProseMirror ol {
    list-style-type: decimal;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
    padding: 0;
  }

  .ProseMirror ol li {
    margin-bottom: 0.5rem;
    list-style-position: outside;
  }

  .ProseMirror ul ul,
  .ProseMirror ol ol,
  .ProseMirror ul ol,
  .ProseMirror ol ul {
    margin-left: 2rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
  }

  .ProseMirror li {
    display: list-item;
  }

  .ProseMirror blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #6b7280;
    font-style: italic;
  }

  .dark .ProseMirror blockquote {
    border-left-color: #374151;
    color: #9ca3af;
  }

  .ProseMirror pre {
    background-color: #1f2937;
    color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
  }

  .ProseMirror pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
  }

  .dark .ProseMirror pre {
    background-color: #000;
  }

  .ProseMirror code {
    background-color: #f3f4f6;
    color: #1f2937;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.9em;
  }

  .dark .ProseMirror code {
    background-color: #1f2937;
    color: #f3f4f6;
  }

  .ProseMirror h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 1.5rem 0 1rem 0;
  }

  .ProseMirror h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 1.25rem 0 0.75rem 0;
  }

  .ProseMirror h3 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 1rem 0 0.5rem 0;
  }

  .ProseMirror a {
    color: #0070c0;
    text-decoration: underline;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .ProseMirror a:hover {
    opacity: 0.8;
    background-color: rgba(0, 112, 192, 0.1);
    border-radius: 2px;
    padding: 0 2px;
  }

  .dark .ProseMirror a {
    color: #60a5fa;
  }

  /* ✅ LIVEBLOCKS COLLABORATION STYLES */
  .collaboration-cursor__caret {
    border-left: 2px solid #0d0d0d;
    margin-left: -1px;
  }

  .collaboration-cursor__label {
    background-color: #0d0d0d;
    color: white;
    border-radius: 3px 3px 0 0;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    position: absolute;
    top: -1.4em;
    white-space: nowrap;
  }

  /* Thread highlights */
  .lb-tiptap-comment-marker {
    background-color: rgba(255, 193, 7, 0.3);
  }
`;

const COLORS = [
  { color: "#000000", name: "Black" },
  { color: "#FFFFFF", name: "White" },
  { color: "#FF0000", name: "Red" },
  { color: "#00B050", name: "Green" },
  { color: "#0070C0", name: "Blue" },
  { color: "#FFC000", name: "Orange" },
];

const CollaborativeEditor = () => {
  // ✅ Liveblocks extensions
  const liveblocks = useLiveblocksExtension();
  const { threads } = useThreads();

  // State
  const [fontSize, setFontSize] = useState("16");
  const [currentStyle, setCurrentStyle] = useState("paragraph");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState("left");
  const [showThreads, setShowThreads] = useState(true);

  // ✅ Editor with Liveblocks
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
    extensions: [
      liveblocks,
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc list-outside" } },
        orderedList: { HTMLAttributes: { class: "list-decimal list-outside" } },
        listItem: { HTMLAttributes: { class: "list-item" } },
        history: false, // ✅ Liveblocks handles history
      }),
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Placeholder.configure({
        placeholder: "Start typing here...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (editor.isActive("heading", { level: 1 })) setCurrentStyle("h1");
      else if (editor.isActive("heading", { level: 2 })) setCurrentStyle("h2");
      else if (editor.isActive("heading", { level: 3 })) setCurrentStyle("h3");
      else setCurrentStyle("paragraph");

      if (editor.isActive({ textAlign: "center" }))
        setCurrentAlignment("center");
      else if (editor.isActive({ textAlign: "right" }))
        setCurrentAlignment("right");
      else if (editor.isActive({ textAlign: "justify" }))
        setCurrentAlignment("justify");
      else setCurrentAlignment("left");

      const marks = editor.getAttributes("textStyle");
      if (marks.color) setCurrentColor(marks.color);
    },
  });

  if (!editor) return <div className="p-8 text-center">Loading editor...</div>;

  const applyFontSize = (size: string) => {
    setFontSize(size);
    editor.chain().focus().setFontSize(`${size}px`).run();
  };

  const handleStyleChange = (style: string) => {
    if (style === "paragraph") editor.chain().focus().setParagraph().run();
    else if (style === "h1")
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (style === "h2")
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (style === "h3")
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    setCurrentStyle(style);
  };

  const handleAlignment = (align: string) => {
    editor.chain().focus().setTextAlign(align).run();
    setCurrentAlignment(align);
  };

  const handleAddLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const getAlignmentIcon = () => {
    if (currentAlignment === "center")
      return <AlignCenter className="w-4 h-4" />;
    if (currentAlignment === "right") return <AlignRight className="w-4 h-4" />;
    if (currentAlignment === "justify")
      return <AlignJustify className="w-4 h-4" />;
    return <AlignLeft className="w-4 h-4" />;
  };

  return (
    <div className="h-full flex flex-col bg-linear-to-b from-gray-50 to-white dark:from-background dark:to-background">
      <style>{editorStyles}</style>

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-background sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center gap-0.5 py-2 flex-wrap justify-between">
            <div className="flex items-center gap-0.5 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().undo().run()}
                className="hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().redo().run()}
                className="hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <Redo2 className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="mx-0.5 h-6" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-gray-100 dark:hover:bg-gray-900 text-sm font-normal"
                  >
                    {currentStyle === "h1"
                      ? "Heading 1"
                      : currentStyle === "h2"
                      ? "Heading 2"
                      : currentStyle === "h3"
                      ? "Heading 3"
                      : "Normal text"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Heading styles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStyleChange("h1")}>
                    <Heading1 className="w-4 h-4 mr-2" />
                    Heading 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStyleChange("h2")}>
                    <Heading2 className="w-4 h-4 mr-2" />
                    Heading 2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStyleChange("h3")}>
                    <Heading3 className="w-4 h-4 mr-2" />
                    Heading 3
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleStyleChange("paragraph")}
                  >
                    Paragraph
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="mx-0.5 h-6" />

              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  editor.isActive("bold") ? "bg-gray-100 dark:bg-gray-900" : ""
                }`}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  editor.isActive("italic")
                    ? "bg-gray-100 dark:bg-gray-900"
                    : ""
                }`}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  editor.isActive("underline")
                    ? "bg-gray-100 dark:bg-gray-900"
                    : ""
                }`}
              >
                <UnderlineIcon className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-gray-100 dark:hover:bg-gray-900 relative"
                  >
                    <Palette className="w-4 h-4" />
                    <div
                      className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-gray-300"
                      style={{ backgroundColor: currentColor }}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Text Color</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COLORS.map(({ color, name }) => (
                    <DropdownMenuItem
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setCurrentColor(color);
                      }}
                      className={currentColor === color ? "bg-accent" : ""}
                    >
                      <div
                        className="w-4 h-4 rounded mr-2 border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                      {name}
                      {currentColor === color && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="mx-0.5 h-6" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    {getAlignmentIcon()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Alignment</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAlignment("left")}>
                    <AlignLeft className="w-4 h-4 mr-2" />
                    Left
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAlignment("center")}>
                    <AlignCenter className="w-4 h-4 mr-2" />
                    Center
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAlignment("right")}>
                    <AlignRight className="w-4 h-4 mr-2" />
                    Right
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAlignment("justify")}>
                    <AlignJustify className="w-4 h-4 mr-2" />
                    Justify
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  editor.isActive("bulletList")
                    ? "bg-gray-100 dark:bg-gray-900"
                    : ""
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  editor.isActive("orderedList")
                    ? "bg-gray-100 dark:bg-gray-900"
                    : ""
                }`}
              >
                <ListOrdered className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="mx-0.5 h-6" />

              {!showLinkInput ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLinkInput(true)}
                  className={`hover:bg-gray-100 dark:hover:bg-gray-900 ${
                    editor.isActive("link")
                      ? "bg-blue-100 dark:bg-blue-900"
                      : ""
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-1 px-1 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddLink();
                      if (e.key === "Escape") setShowLinkInput(false);
                    }}
                    className="h-7 w-40 text-sm border-0 bg-transparent"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAddLink}
                    className="h-6 w-6 p-0"
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowLinkInput(false);
                      handleRemoveLink();
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>More options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      editor.chain().focus().toggleBlockquote().run()
                    }
                  >
                    <Quote className="w-4 h-4 mr-2" />
                    Blockquote
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      editor.chain().focus().toggleCodeBlock().run()
                    }
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-4">
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">
            <div className="bg-white dark:bg-background min-h-screen rounded-2xl border p-12">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;
