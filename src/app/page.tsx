'use client';

import { AppShell } from '@/components/layout/AppShell';
import { NoteEditor } from '@/components/notebook/NoteEditor';
import { NoteList } from '@/components/notebook/NoteList';
import { SettingsView } from '@/components/settings/SettingsView';
import { useAppStore } from '@/store/useAppStore';

export default function Home() {
  const { activePillar } = useAppStore();

  return (
    <AppShell listPanelContent={activePillar === 'notebook' ? <NoteList /> : undefined}>
      {activePillar === 'settings' ? <SettingsView /> : <NoteEditor />}
    </AppShell>
  );
}
