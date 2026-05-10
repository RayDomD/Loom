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

export type Macro = {
  id: string;
  label: string;
  trigger: 'double-tab';
  action: 'insert-1x1-table';
  enabled: boolean;
  updatedAt: string;
};

class LoomDatabase extends Dexie {
  folders!: Table<Folder, string>;
  notes!: Table<Note, string>;
  macros!: Table<Macro, string>;

  constructor() {
    super("loom");

    this.version(1).stores({
      folders: "id, parentId, depth, updatedAt",
      notes: "id, folderId, isPinned, updatedAt",
    });

    this.version(2).stores({
      folders: "id, parentId, depth, updatedAt",
      notes: "id, folderId, isPinned, updatedAt",
      macros: "id, trigger, action, enabled, updatedAt",
    });
  }
}

export const db = new LoomDatabase();
