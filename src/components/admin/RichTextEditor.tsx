'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  id?: string;
}

export function RichTextEditor({ value, onChange, placeholder, height = 400 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-terracotta-600 underline' } }),
      Image,
      Placeholder.configure({ placeholder: placeholder || 'Escribe el contenido...' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] px-4 py-3 text-[15px] leading-relaxed text-foreground [&_h2]:text-xl [&_h2]:font-serif [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-sand-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#7a6b5d]',
      },
    },
  });

  const handleUpdate = useCallback(() => {
    if (editor) onChange(editor.getHTML());
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, handleUpdate]);

  if (!editor) return <div className="animate-pulse h-48 bg-sand-100 rounded-xl" />;

  return (
    <div className="border border-sand-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-sand-200 bg-sand-50">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
          <s>S</s>
        </ToolbarButton>
        <span className="w-px h-5 bg-sand-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3">
          H3
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Título 4">
          H4
        </ToolbarButton>
        <span className="w-px h-5 bg-sand-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
          •
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
          1.
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
          "
        </ToolbarButton>
        <span className="w-px h-5 bg-sand-300 mx-1" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('URL del enlace:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive('link')}
          title="Enlace"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('URL de la imagen:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          title="Imagen"
        >
          🖼
        </ToolbarButton>
      </div>
      {/* Editor */}
      <div style={{ minHeight: height }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
        active ? 'bg-terracotta-100 text-terracotta-700' : 'hover:bg-sand-200 text-[#7a6b5d]'
      }`}
    >
      {children}
    </button>
  );
}
