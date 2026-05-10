'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  Pin,
  Plus,
  Trash2,
} from 'lucide-react';
import { useNotebook } from '@/hooks/useNotebook';
import { cn } from '@/lib/utils';
import type { Folder, Note } from '@/lib/db';
import { useAppStore } from '@/store/useAppStore';

export function NoteList() {
  const {
    folders,
    notes,
    createFolder,
    createNote,
    deleteNote,
    deleteFolder,
    renameFolder,
    togglePin,
  } = useNotebook();
  const { activeItemId, setActiveItemId } = useAppStore();
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  const handleCreateNote = async (folderId: string | null = null) => {
    const id = await createNote('Untitled Note', folderId);
    setActiveItemId(id);
  };

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:');
    if (name?.trim()) {
      await createFolder(name.trim());
    }
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (activeItemId === id) {
      setActiveItemId(null);
    }
  };

  const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
    if (!currentlyPinned) {
      const pinnedCount = notes.filter((note) => note.isPinned).length;
      if (pinnedCount >= 5) {
        alert('You can pin at most 5 notes.');
        return;
      }
    }

    await togglePin(id, !currentlyPinned);
  };

  const handleRenameFolder = async (id: string, currentName: string) => {
    const name = prompt('Folder name:', currentName);
    if (name?.trim() && name.trim() !== currentName) {
      await renameFolder(id, name.trim());
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Notes inside will be moved to root.`)) {
      return;
    }

    await deleteFolder(id);
  };

  const toggleFolder = (id: string) => {
    setCollapsedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const pinnedNotes = notes.filter((note) => note.isPinned);
  const rootNotes = notes.filter((note) => !note.isPinned && !note.folderId);
  const topFolders = folders.filter((folder) => folder.depth === 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between px-2 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Notebook
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleCreateFolder}
            className="rounded p-1 text-gray-600 hover:bg-white/20"
            title="New Folder"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleCreateNote()}
            className="rounded p-1 text-gray-600 hover:bg-white/20"
            title="New Note"
          >
            <FileText size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {pinnedNotes.map((note) => (
          <NoteRow
            key={note.id}
            title={note.title}
            isPinned
            isActive={activeItemId === note.id}
            onSelect={() => setActiveItemId(note.id)}
            onDelete={() => handleDeleteNote(note.id)}
            onTogglePin={() => handleTogglePin(note.id, true)}
          />
        ))}

        {pinnedNotes.length > 0 && <div className="my-1.5 border-t border-black/[0.06]" />}

        {topFolders.map((folder) => (
          <FolderSection
            key={folder.id}
            folder={folder}
            notes={notes.filter((note) => !note.isPinned && note.folderId === folder.id)}
            isCollapsed={collapsedFolderIds.has(folder.id)}
            activeItemId={activeItemId}
            onToggle={() => toggleFolder(folder.id)}
            onRename={() => handleRenameFolder(folder.id, folder.name)}
            onDelete={() => handleDeleteFolder(folder.id, folder.name)}
            onCreateNote={() => handleCreateNote(folder.id)}
            onSelectNote={(id) => setActiveItemId(id)}
            onDeleteNote={handleDeleteNote}
            onTogglePin={handleTogglePin}
          />
        ))}

        {rootNotes.map((note) => (
          <NoteRow
            key={note.id}
            title={note.title}
            isPinned={false}
            isActive={activeItemId === note.id}
            onSelect={() => setActiveItemId(note.id)}
            onDelete={() => handleDeleteNote(note.id)}
            onTogglePin={() => handleTogglePin(note.id, false)}
          />
        ))}
      </div>
    </div>
  );
}

function FolderSection({
  folder,
  notes,
  isCollapsed,
  activeItemId,
  onToggle,
  onRename,
  onDelete,
  onCreateNote,
  onSelectNote,
  onDeleteNote,
  onTogglePin,
}: {
  folder: Folder;
  notes: Note[];
  isCollapsed: boolean;
  activeItemId: string | null;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCreateNote: () => void;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string, currentlyPinned: boolean) => void;
}) {
  return (
    <div className="py-1">
      <div
        className="group relative flex cursor-pointer items-center rounded px-2 py-1.5 pr-1 text-gray-600 transition-colors hover:bg-white/10"
        onClick={onToggle}
      >
        <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {folder.name}
        </span>
        <span className="mx-2 h-px flex-1 bg-black/[0.08]" />
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        <div className="ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRename();
            }}
            title="Rename folder"
            className="rounded p-0.5 text-gray-500 transition-colors hover:bg-white/40 hover:text-gray-700"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            title="Delete folder"
            className="rounded p-0.5 text-gray-500 transition-colors hover:bg-white/40 hover:text-red-500"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {notes.map((note) => (
            <NoteRow
              key={note.id}
              title={note.title}
              isPinned={false}
              isActive={activeItemId === note.id}
              onSelect={() => onSelectNote(note.id)}
              onDelete={() => onDeleteNote(note.id)}
              onTogglePin={() => onTogglePin(note.id, false)}
            />
          ))}
          <button
            type="button"
            onClick={onCreateNote}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-500 hover:bg-white/10"
          >
            <Plus size={12} />
            <span>new note</span>
          </button>
        </>
      )}
    </div>
  );
}

function NoteRow({
  title,
  isPinned,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
}: {
  title: string;
  isPinned: boolean;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center rounded pr-1 transition-colors',
        isActive ? 'bg-white/80 shadow-[0_1px_4px_rgba(0,0,0,0.07)]' : 'hover:bg-white/20',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 overflow-hidden px-2 py-1.5 text-left text-sm"
      >
        {isPinned ? (
          <Pin size={13} className="flex-shrink-0 text-amber-600" />
        ) : (
          <FileText size={13} className="flex-shrink-0 text-gray-500" />
        )}
        <span
          className={cn(
            'truncate',
            isActive ? 'font-medium text-gray-900' : 'text-gray-600',
          )}
        >
          {title || 'Untitled Note'}
        </span>
      </button>

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin();
          }}
          title={isPinned ? 'Unpin' : 'Pin'}
          className={cn(
            'rounded p-0.5 transition-colors hover:bg-white/40',
            isPinned ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500',
          )}
        >
          <Pin size={11} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          title="Delete note"
          className="rounded p-0.5 text-gray-500 transition-colors hover:bg-white/40 hover:text-red-500"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
