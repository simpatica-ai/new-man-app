'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react' // ## FIX: Import the 'Editor' type
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Button } from './ui/button'

// --- Toolbar Component ---
// ## FIX: Replaced 'any' with the specific 'Editor' type
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null

  return (
    <div className="border border-gray-300 rounded-t-lg p-2 bg-gray-50 flex gap-2">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive('bold') ? 'default' : 'outline'}
        size="sm"
      >
        Bold
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive('italic') ? 'default' : 'outline'}
        size="sm"
      >
        Italic
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        variant={editor.isActive('underline') ? 'default' : 'outline'}
        size="sm"
      >
        Underline
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
        size="sm"
      >
        H1
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
        size="sm"
      >
        H2
      </Button>
       <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
        size="sm"
      >
        H3
      </Button>
    </div>
  )
}

// --- Main Editor Component ---
const TiptapEditor = ({ content, onChange }: { content: string, onChange: (html: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // configure extensions as needed
      }),
      Underline,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-4 min-h-[300px] bg-white border border-gray-300 rounded-b-lg focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor
