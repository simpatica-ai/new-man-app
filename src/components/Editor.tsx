// src/components/Editor.tsx
"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Underline, Heading1, Heading2, Heading3 } from 'lucide-react';
import React from 'react';

// --- Toolbar Component ---
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleH1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleH3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run();

  const isActive = (type: string, opts?: Record<string, unknown>) => editor.isActive(type, opts) ? 'is-active' : '';

  return (
    <div className="flex items-center gap-2 border border-stone-300 bg-stone-50 p-2 rounded-t-md">
      <button onClick={toggleBold} className={`p-2 rounded hover:bg-stone-200 ${isActive('bold')}`}>
        <Bold className="h-4 w-4" />
      </button>
      <button onClick={toggleItalic} className={`p-2 rounded hover:bg-stone-200 ${isActive('italic')}`}>
        <Italic className="h-4 w-4" />
      </button>
      <button onClick={toggleUnderline} className={`p-2 rounded hover:bg-stone-200 ${isActive('underline')}`}>
        <Underline className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-stone-300 mx-1"></div>
      <button onClick={toggleH1} className={`p-2 rounded hover:bg-stone-200 ${isActive('heading', { level: 1 })}`}>
        <Heading1 className="h-4 w-4" />
      </button>
      <button onClick={toggleH2} className={`p-2 rounded hover:bg-stone-200 ${isActive('heading', { level: 2 })}`}>
        <Heading2 className="h-4 w-4" />
      </button>
      <button onClick={toggleH3} className={`p-2 rounded hover:bg-stone-200 ${isActive('heading', { level: 3 })}`}>
        <Heading3 className="h-4 w-4" />
      </button>
      <style jsx>{`
        .is-active {
          background-color: #e7e5e4; /* stone-200 */
        }
      `}</style>
    </div>
  );
};


// --- Main Editor Component ---
interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none p-4 min-h-[200px] border-x border-b border-stone-300 rounded-b-md focus:outline-none bg-white',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div>
      {/* --- CSS FIX: This style tag addresses the ProseMirror console warning --- */}
      <style jsx global>{`
        .ProseMirror {
          white-space: pre-wrap;
        }
      `}</style>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;