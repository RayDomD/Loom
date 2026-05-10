'use client';

import { ReactNode } from 'react';
import { Rail } from './Rail';
import { useAppStore } from '@/store/useAppStore';

interface AppShellProps {
  children: ReactNode; // Main panel content
  listPanelContent?: ReactNode; // Secondary panel content
}

export function AppShell({ children, listPanelContent }: AppShellProps) {
  const { activePillar } = useAppStore();

  return (
    <div className="flex h-screen w-full overflow-hidden text-gray-900">
      {/* 58px Fixed Rail */}
      <Rail />

      {/* 228px List Panel (Conditional based on pillar) */}
      <div className="w-[228px] h-full glass-panel border-r border-white/20 flex-shrink-0 flex flex-col z-10">
        <div className="p-4 border-b border-white/10 font-medium capitalize">
          {activePillar}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {listPanelContent || (
            <div className="text-sm text-gray-500 p-2 italic">
              {activePillar} list goes here
            </div>
          )}
        </div>
      </div>

      {/* Flexible Main Panel */}
      <main className="flex-1 h-full glass-main relative overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
