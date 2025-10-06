// src/components/Editor.tsx
"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Underline, Heading1, Heading2, Heading3, List, ListOrdered } from 'lucide-react';
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
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();

  const isActive = (type: string, opts?: Record<string, unknown>) => editor.isActive(type, opts) ? 'is-active' : '';

  return (
    <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-t-md border-b border-stone-200">
      <button onClick={toggleBold} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('bold')}`}>
        <Bold className="h-4 w-4" />
      </button>
      <button onClick={toggleItalic} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('italic')}`}>
        <Italic className="h-4 w-4" />
      </button>
      <button onClick={toggleUnderline} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('underline')}`}>
        <Underline className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-stone-300 mx-1"></div>
      <button onClick={toggleH1} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('heading', { level: 1 })}`}>
        <Heading1 className="h-4 w-4" />
      </button>
      <button onClick={toggleH2} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('heading', { level: 2 })}`}>
        <Heading2 className="h-4 w-4" />
      </button>
      <button onClick={toggleH3} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('heading', { level: 3 })}`}>
        <Heading3 className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-stone-300 mx-1"></div>
      <button onClick={toggleBulletList} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('bulletList')}`}>
        <List className="h-4 w-4" />
      </button>
      <button onClick={toggleOrderedList} className={`p-2 rounded hover:bg-stone-200 transition-colors ${isActive('orderedList')}`}>
        <ListOrdered className="h-4 w-4" />
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
  height?: number;
}

const TiptapEditor = ({ content, onChange, height }: TiptapEditorProps) => {
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
        class: 'prose prose-stone max-w-none p-4 border-x border-b border-stone-300 focus:outline-none bg-white',
        style: height ? `height: ${height - 60}px; overflow-y: auto;` : 'min-height: 200px;',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="relative border border-stone-300 rounded-md bg-white">
      {/* --- CSS FIX: This style tag addresses the ProseMirror console warning --- */}
      <style jsx global>{`
        .ProseMirror {
          white-space: pre-wrap;
        }
        .ProseMirror ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          padding-left: 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          padding-left: 0;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
        }
        
        /* Sticky toolbar styles */
        .editor-container {
          position: relative;
          overflow: hidden;
        }
        
        .sticky-toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: white;
          border-bottom: 1px solid #d6d3d1; /* stone-300 */
        }
        
        .editor-content-container {
          overflow-y: auto;
          border-radius: 0 0 0.375rem 0.375rem; /* rounded-b-md */
        }
      `}</style>
      
      <div className="editor-container">
        <div className="sticky-toolbar">
          <Toolbar editor={editor} />
        </div>
        <div className="editor-content-container" style={{ height: height ? `${height - 60}px` : '200px' }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default TiptapEditor;