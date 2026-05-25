export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
}
