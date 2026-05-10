import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function useNotebook() {
  const folders = useLiveQuery(() => db.folders.toArray(), []);
  const notes = useLiveQuery(() => db.notes.toArray(), []);

  const createFolder = async (
    name: string,
    parentId: string | null = null,
    depth: 0 | 1 = 0,
  ) => {
    const now = new Date().toISOString();
    return await db.folders.add({
      id: uuidv4(),
      parentId,
      name,
      color: '#B2A398',
      depth,
      createdAt: now,
      updatedAt: now,
    });
  };

  const createNote = async (title: string, folderId: string | null = null) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.notes.add({
      id,
      folderId,
      title,
      content: '{"type":"doc","content":[]}',
      isPinned: false,
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  };

  const updateNoteContent = async (id: string, content: unknown, wordCount: number) => {
    await db.notes.update(id, {
      content,
      wordCount,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateNoteTitle = async (id: string, title: string) => {
    await db.notes.update(id, {
      title,
      updatedAt: new Date().toISOString(),
    });
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    await db.notes.update(id, {
      isPinned,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteNote = async (id: string) => {
    await db.notes.delete(id);
  };

  const deleteFolder = async (id: string) => {
    await db.transaction('rw', db.folders, db.notes, async () => {
      await db.notes.where('folderId').equals(id).modify({ folderId: null });
      await db.folders.delete(id);
    });
  };

  const renameFolder = async (id: string, name: string) => {
    await db.folders.update(id, {
      name,
      updatedAt: new Date().toISOString(),
    });
  };

  return {
    folders: folders || [],
    notes: notes || [],
    createFolder,
    createNote,
    updateNoteContent,
    updateNoteTitle,
    togglePin,
    deleteNote,
    deleteFolder,
    renameFolder,
  };
}
