export interface Vote {
  id: string;
  value: number;
  fileId: string;
  userId: string;
  createdAt: string;
}

export interface CreateVoteInput {
  value: number;
}
