export interface InvestmentInterest {
  id: string;
  fileId: string;
  userId: string;
  amount: number | null;
  message: string | null;
  createdAt: string;
}

export interface CreateInvestmentInterestInput {
  amount?: number;
  message?: string;
}
