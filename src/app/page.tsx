import { AppShell } from '@/components/layout/AppShell';
import { NoteEditor } from '@/components/notebook/NoteEditor';
import { NoteList } from '@/components/notebook/NoteList';

export default function Home() {
  return (
    <AppShell listPanelContent={<NoteList />}>
      <NoteEditor />
    </AppShell>
  );
}
