'use client';

import { useNotebook } from '@/hooks/useNotebook';
import { useAppStore } from '@/store/useAppStore';
import { Folder, FileText, Plus, Pin } from 'lucide-react';

export function NoteList() {
  const { folders, notes, createFolder, createNote } = useNotebook();
  const { activeItemId, setActiveItemId } = useAppStore();

  const handleCreateNote = async () => {
    const id = await createNote('Untitled Note');
    setActiveItemId(id);
  };

  const handleCreateFolder = async () => {
    const name = prompt('Folder Name:');
    if (name) await createFolder(name);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with quick actions */}
      <div className="flex justify-between items-center px-2 py-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Notebook
        </span>
        <div className="flex gap-1">
          <button onClick={handleCreateFolder} className="p-1 hover:bg-white/20 rounded text-gray-500" title="New Folder">
            <Plus size={14} />
          </button>
          <button onClick={handleCreateNote} className="p-1 hover:bg-white/20 rounded text-gray-500" title="New Note">
            <FileText size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {/* Section: Pinned Notes */}
        {notes.filter(n => n.isPinned).map(note => (
          <button
            key={note.id}
            onClick={() => setActiveItemId(note.id)}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm transition-colors ${
              activeItemId === note.id ? 'bg-white/40 text-gray-900 font-medium' : 'text-gray-700 hover:bg-white/20'
            }`}
          >
            <Pin size={14} className="text-amber-600 flex-shrink-0" />
            <span className="truncate">{note.title || 'Untitled Note'}</span>
          </button>
        ))}

        {notes.some(n => n.isPinned) && <div className="my-2 border-t border-white/10" />}

        {/* Section: Folders */}
        {folders.filter(f => f.depth === 0).map(folder => (
          <div key={folder.id} className="px-2 py-1.5 flex items-center gap-2 text-sm text-gray-700 font-medium cursor-default">
            <Folder size={14} className="text-gray-400" />
            <span className="truncate">{folder.name}</span>
          </div>
        ))}

        {/* Section: Unpinned Root Notes */}
        {notes.filter(n => !n.isPinned && !n.folderId).map(note => (
          <button
            key={note.id}
            onClick={() => setActiveItemId(note.id)}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm transition-colors ${
              activeItemId === note.id ? 'bg-white/40 text-gray-900 font-medium' : 'text-gray-700 hover:bg-white/20'
            }`}
          >
            <FileText size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{note.title || 'Untitled Note'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
