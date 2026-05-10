'use client';

import { useEffect, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { Folder } from 'lucide-react';
import { BlockInsertMenu } from '@/components/notebook/BlockInsertMenu';
import { EditorToolbar } from '@/components/notebook/EditorToolbar';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useNotebook } from '@/hooks/useNotebook';
import { db, type Note } from '@/lib/db';
import { useAppStore } from '@/store/useAppStore';

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] };

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="text-sm text-gray-400">Select a note or create a new one</p>
    </div>
  );
}

function parseNoteContent(content: unknown): JSONContent {
  if (!content) {
    return EMPTY_DOC;
  }

  if (typeof content === 'string') {
    try {
      return JSON.parse(content) as JSONContent;
    } catch {
      return EMPTY_DOC;
    }
  }

  return content as JSONContent;
}

function getWordCount(storage: unknown) {
  const characterCount = storage as { words?: () => number } | undefined;
  return characterCount?.words?.() ?? 0;
}

export function NoteEditor() {
  const { activeItemId } = useAppStore();
  const { folders, updateNoteContent, updateNoteTitle } = useNotebook();
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [meta, setMeta] = useState<Pick<Note, 'folderId' | 'createdAt'> | null>(null);
  const activeItemIdRef = useRef(activeItemId);
  const updateNoteContentRef = useRef(updateNoteContent);
  const { schedule, flush } = useAutoSave();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false }),
      Link.configure({ autolink: true, openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start typing your knowledge...' }),
      CharacterCount,
      TaskList,
      TaskItem.configure({ nested: false }),
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        class: 'tiptap-editor min-h-[300px] focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    activeItemIdRef.current = activeItemId;
  }, [activeItemId]);

  useEffect(() => {
    updateNoteContentRef.current = updateNoteContent;
  }, [updateNoteContent]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleUpdate = () => {
      const id = activeItemIdRef.current;
      const content = editor.getJSON();
      const nextWordCount = getWordCount(editor.storage.characterCount);

      setWordCount(nextWordCount);
      schedule(async () => {
        if (!id) {
          return;
        }

        await updateNoteContentRef.current(id, content, nextWordCount);
      });
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, schedule]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    void flush();

    if (!activeItemId) {
      editor.commands.setContent(EMPTY_DOC, { emitUpdate: false });
      setTitle('');
      setMeta(null);
      setWordCount(0);
      return;
    }

    let cancelled = false;

    void db.notes.get(activeItemId).then((note) => {
      if (cancelled || !note) {
        return;
      }

      editor.commands.setContent(parseNoteContent(note.content), { emitUpdate: false });
      setTitle(note.title);
      setMeta({ folderId: note.folderId, createdAt: note.createdAt });
      setWordCount(note.wordCount ?? getWordCount(editor.storage.characterCount));
    });

    return () => {
      cancelled = true;
    };
  }, [activeItemId, editor, flush]);

  useEffect(
    () => () => {
      void flush();
    },
    [flush],
  );

  if (!activeItemId) {
    return <EmptyState />;
  }

  const folder = meta?.folderId ? folders.find((item) => item.id === meta.folderId) : null;
  const date = meta?.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar editor={editor} />

      <div className="flex-shrink-0 border-b border-white/10 px-8 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          {folder && (
            <>
              <Folder size={11} className="flex-shrink-0" />
              <span>{folder.name}</span>
              <span>.</span>
            </>
          )}
          {date && <span>{date}</span>}
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (activeItemId) {
              void updateNoteTitle(activeItemId, title);
            }
          }}
          placeholder="Untitled Note"
          className="w-full border-none bg-transparent text-[22px] font-bold leading-tight text-gray-900 outline-none placeholder:text-gray-300"
        />
      </div>

      <div className="relative flex-1 overflow-y-auto px-8 py-6">
        {editor && <BlockInsertMenu editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-shrink-0 items-center justify-end border-t border-white/10 px-8 py-2">
        <span className="text-xs text-gray-400">{wordCount} words</span>
      </div>
    </div>
  );
}
