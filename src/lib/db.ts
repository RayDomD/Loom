import Dexie, { type Table } from "dexie";

export type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
  depth: 0 | 1;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  userId?: string;
  folderId: string | null;
  title: string;
  content: unknown;
  isPinned: boolean;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

class LoomDatabase extends Dexie {
  folders!: Table<Folder, string>;
  notes!: Table<Note, string>;

  constructor() {
    super("loom");

    this.version(1).stores({
      folders: "id, parentId, depth, updatedAt",
      notes: "id, folderId, isPinned, updatedAt",
    });
  }
}

export const db = new LoomDatabase();
