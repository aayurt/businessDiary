export interface MdFile {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string | null;
  coverImage: string | null;
  published: boolean;
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
  published: boolean;
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
  published?: boolean;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface UpdateMdFileInput {
  title?: string;
  slug?: string;
  content?: string;
  description?: string | null;
  coverImage?: string | null;
  published?: boolean;
  categoryIds?: string[];
  tagIds?: string[];
}
