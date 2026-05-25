export interface Comment {
  id: string;
  content: string;
  fileId: string;
  authorId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  content: string;
  fileId: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  content?: string;
}
