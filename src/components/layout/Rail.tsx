'use client';

import { useAppStore } from '@/store/useAppStore';
import { Book, Inbox, Library, LayoutGrid, Settings } from 'lucide-react';

export function Rail() {
  const { activePillar, setActivePillar } = useAppStore();

  const navItems = [
    { id: 'notebook', icon: Book, label: 'Notebook' },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'tempdump', icon: Inbox, label: 'TempDump' },
    { id: 'collections', icon: LayoutGrid, label: 'Collections' },
  ] as const;

  return (
    <nav className="w-[58px] h-full flex flex-col items-center py-6 glass-rail border-r border-white/20 z-20">
      <div className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePillar === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePillar(item.id)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-white/40 shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:bg-white/20 hover:text-gray-700'
              }`}
              title={item.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setActivePillar('settings')}
        className={`p-3 rounded-xl transition-all duration-200 mt-auto ${
          activePillar === 'settings'
            ? 'bg-white/40 shadow-sm text-gray-900'
            : 'text-gray-500 hover:bg-white/20 hover:text-gray-700'
        }`}
        title="Settings"
      >
        <Settings size={20} />
      </button>
    </nav>
  );
}
