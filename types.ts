export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Member {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  type: TransactionType;
  amount: number;
  description: string;
  memberId?: string; // Optional, mostly for Income
  memberName?: string; // Denormalized for display convenience
  createdAt: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
}

export type ViewState = 'DASHBOARD' | 'INCOME' | 'EXPENSE' | 'HISTORY' | 'MEMBERS';