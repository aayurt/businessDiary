export interface BudgetEstimate {
  id: string;
  fileId: string;
  amount: number;
  currency: string;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetEstimateInput {
  amount: number;
  currency?: string;
  description?: string;
}

export interface UpdateBudgetEstimateInput {
  amount?: number;
  currency?: string;
  description?: string | null;
}
