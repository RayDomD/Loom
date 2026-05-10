'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText, Folder, MoreHorizontal, Pin, Plus } from 'lucide-react';
import { Rail } from './Rail';
import { useNotebook } from '@/hooks/useNotebook';
import { useAppStore } from '@/store/useAppStore';

interface AppShellProps {
  children: ReactNode;
  listPanelContent?: ReactNode;
}

const PANEL_SPRING = { damping: 25, stiffness: 200 };

export function AppShell({ children, listPanelContent }: AppShellProps) {
  const {
    activePillar,
    isListPanelCollapsed,
    setListPanelCollapsed,
    setActiveItemId,
  } = useAppStore();
  const { folders, notes, createNote } = useNotebook();

  const pinnedNotes = notes.filter((note) => note.isPinned);
  const rootNotes = notes.filter((note) => !note.isPinned && !note.folderId);
  const topFolders = folders.filter((folder) => folder.depth === 0);

  const expandPanel = () => setListPanelCollapsed(false);

  const handleCreateNote = async () => {
    const id = await createNote('Untitled Note');
    setActiveItemId(id);
    expandPanel();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-gray-900">
      <Rail />

      <motion.div
        layout
        transition={{ type: 'spring', ...PANEL_SPRING }}
        className="z-10 flex h-full flex-shrink-0 flex-col overflow-hidden border-r border-black/[0.06] glass-panel"
        animate={{ width: isListPanelCollapsed ? 44 : 228 }}
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] p-3">
          {!isListPanelCollapsed && (
            <span className="font-medium capitalize text-gray-700">{activePillar}</span>
          )}
          <button
            type="button"
            onClick={() => setListPanelCollapsed(!isListPanelCollapsed)}
            className="ml-auto rounded-md p-1 text-gray-600 hover:bg-white/30"
            title={isListPanelCollapsed ? 'Expand list panel' : 'Collapse list panel'}
          >
            {isListPanelCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {isListPanelCollapsed ? (
          <div className="flex flex-1 flex-col items-center gap-2 px-1.5 py-3">
            {pinnedNotes.length > 0 && (
              <IconStripButton title="Pinned notes" onClick={expandPanel}>
                <Pin size={16} className="text-amber-600" />
              </IconStripButton>
            )}
            {topFolders.slice(0, 3).map((folder) => (
              <IconStripButton key={folder.id} title={folder.name} onClick={expandPanel}>
                <Folder size={16} />
              </IconStripButton>
            ))}
            {topFolders.length > 3 && (
              <IconStripButton title="More folders" onClick={expandPanel}>
                <MoreHorizontal size={16} />
              </IconStripButton>
            )}
            {rootNotes.length > 0 && (
              <IconStripButton title="Root notes" onClick={expandPanel}>
                <FileText size={16} />
              </IconStripButton>
            )}
            <IconStripButton title="New note" onClick={handleCreateNote}>
              <Plus size={16} />
            </IconStripButton>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2">
            {listPanelContent || (
              <div className="p-2 text-sm italic text-gray-600">
                {activePillar} list goes here
              </div>
            )}
          </div>
        )}
      </motion.div>

      <main className="relative flex h-full flex-1 flex-col overflow-hidden glass-main">
        {children}
      </main>
    </div>
  );
}

function IconStripButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-700 hover:bg-white/40"
    >
      {children}
    </button>
  );
}
