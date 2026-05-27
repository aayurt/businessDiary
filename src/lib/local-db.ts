import Dexie, { type Table } from 'dexie';
import { PrivacyMode } from '@/types/file';

export interface LocalFile {
  id: string;
  title: string;
  slug: string;
  content: string;
  description?: string;
  privacy: PrivacyMode;
  confidenceScore?: number;
  projectId?: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  synced: number; // 0 for not synced, 1 for synced
  lastModified: number; // Timestamp
}

export interface LocalProject {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  synced: number;
}

export class MyLocalDatabase extends Dexie {
  files!: Table<LocalFile>;
  projects!: Table<LocalProject>;

  constructor() {
    super('BusinessDiaryDB');
    this.version(1).stores({
      files: 'id, title, slug, projectId, authorId, synced, lastModified',
      projects: 'id, name, userId, synced'
    });
  }
}

export const localDb = new MyLocalDatabase();
