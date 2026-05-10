'use client';

import { useState, type ReactNode } from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Highlighter,
  Italic,
  Link2,
  Strikethrough,
  Underline,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {} from '@tiptap/extension-bold';
import type {} from '@tiptap/extension-code';
import type {} from '@tiptap/extension-heading';
import type {} from '@tiptap/extension-highlight';
import type {} from '@tiptap/extension-italic';
import type {} from '@tiptap/extension-link';
import type {} from '@tiptap/extension-strike';
import type {} from '@tiptap/extension-underline';

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: ReactNode;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fde047' },
  { name: 'Peach', value: '#fed7aa' },
  { name: 'Pink', value: '#fecaca' },
  { name: 'Lavender', value: '#e9d5ff' },
  { name: 'Mint', value: '#bbf7d0' },
];

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        'flex items-center justify-center rounded-md p-1.5 text-gray-600 transition-colors hover:bg-white/40',
        isActive &&
          'bg-white/80 text-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.07)]',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px flex-shrink-0 bg-black/10" />;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [lastHighlightColor, setLastHighlightColor] = useState('#fde047');
  const [isHighlightOpen, setIsHighlightOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL:', previousUrl ?? '');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  const applyHighlight = (color: string) => {
    setLastHighlightColor(color);
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  return (
    <div
      className="flex flex-shrink-0 flex-wrap items-center gap-0.5 border-b border-black/[0.06] px-3 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.60)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <span className="w-5 text-center text-xs font-bold leading-none">H1</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <span className="w-5 text-center text-xs font-bold leading-none">H2</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <span className="w-5 text-center text-xs font-bold leading-none">H3</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Link"
      >
        <Link2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code size={14} />
      </ToolbarButton>

      <Divider />

      <div className="relative flex items-center">
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            applyHighlight(lastHighlightColor);
          }}
          title="Highlight"
          className="relative flex items-center justify-center rounded-md p-1.5 text-gray-600 transition-colors hover:bg-white/40"
        >
          <Highlighter size={14} />
          <span
            className="absolute bottom-0.5 h-0.5 w-3 rounded-full"
            style={{ backgroundColor: lastHighlightColor }}
          />
        </button>
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            setIsHighlightOpen((open) => !open);
          }}
          title="Highlight colors"
          className="rounded-md px-1 py-1.5 text-[10px] leading-none text-gray-500 hover:bg-white/40"
        >
          v
        </button>

        {isHighlightOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onMouseDown={() => setIsHighlightOpen(false)}
            />
            <div
              className="absolute left-0 top-8 z-50 flex items-center gap-1 rounded-[10px] p-1.5"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setIsHighlightOpen(false);
                    applyHighlight(color.value);
                  }}
                  className="h-5 w-5 rounded-full border border-black/10"
                  style={{ backgroundColor: color.value }}
                />
              ))}
              <button
                type="button"
                title="Clear highlight"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsHighlightOpen(false);
                  editor.chain().focus().unsetHighlight().run();
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white text-gray-500"
              >
                <X size={11} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
