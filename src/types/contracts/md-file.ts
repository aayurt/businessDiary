import type { PrivacyMode } from "../file"

export interface MdFile {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  coverImage: string | null;
  privacy: PrivacyMode;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MdFileSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  privacy: PrivacyMode;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMdFileInput {
  title: string;
  slug: string;
  content: string;
  description?: string;
  coverImage?: string;
  privacy?: PrivacyMode;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface UpdateMdFileInput {
  title?: string;
  slug?: string;
  content?: string;
  description?: string | null;
  coverImage?: string | null;
  privacy?: PrivacyMode;
  categoryIds?: string[];
  tagIds?: string[];
}
