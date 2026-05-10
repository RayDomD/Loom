'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { FloatingMenu } from '@tiptap/react/menus';
import {
  CheckSquare,
  Code2,
  ImageIcon,
  Minus,
  Plus,
  Table2,
} from 'lucide-react';
import type {} from '@tiptap/extension-code-block';
import type {} from '@tiptap/extension-horizontal-rule';
import type {} from '@tiptap/extension-image';
import type {} from '@tiptap/extension-list';
import type {} from '@tiptap/extension-table';

interface BlockInsertMenuProps {
  editor: Editor;
}

const INSERT_ITEMS = [
  {
    label: 'Table',
    icon: Table2,
    action: (editor: Editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    label: 'Image',
    icon: ImageIcon,
    action: (editor: Editor) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];

        if (!file) {
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result;

          if (typeof src !== 'string') {
            return;
          }

          editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
  },
  {
    label: 'Code Block',
    icon: Code2,
    action: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Task List',
    icon: CheckSquare,
    action: (editor: Editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Divider',
    icon: Minus,
    action: (editor: Editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

export function BlockInsertMenu({ editor }: BlockInsertMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <FloatingMenu
      editor={editor}
      options={{ offset: 8, placement: 'left-start' }}
      shouldShow={({ state }) => {
        const { selection } = state;
        const { $anchor, empty } = selection;

        return (
          empty &&
          $anchor.depth === 1 &&
          $anchor.parent.type.name === 'paragraph' &&
          $anchor.parent.content.size === 0
        );
      }}
    >
      <div className="relative">
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            setOpen((current) => !current);
          }}
          className="-ml-7 flex h-5 w-5 items-center justify-center rounded-full text-indigo-500"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.10)',
          }}
        >
          <Plus size={12} />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onMouseDown={() => setOpen(false)}
            />
            <div
              className="absolute left-0 top-6 z-50 w-44 rounded-[10px] p-1.5"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              {INSERT_ITEMS.map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setOpen(false);
                    action(editor);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-white/60"
                >
                  <Icon size={14} className="flex-shrink-0 text-gray-400" />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </FloatingMenu>
  );
}
