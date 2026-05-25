export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagInput {
  name: string;
  slug: string;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
}
