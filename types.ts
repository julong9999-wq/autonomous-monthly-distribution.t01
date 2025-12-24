export enum Category {
  Q1 = "季一", // Jan, Apr, Jul, Oct
  Q2 = "季二", // Feb, May, Aug, Nov
  Q3 = "季三", // Mar, Jun, Sep, Dec
  Monthly = "月配",
  Bond = "債券"
}

export interface DividendRecord {
  date: string; // Ex-dividend date
  payDate: string;
  amount: number;
}

export interface ETFData {
  code: string;
  name: string;
  category: Category;
  issuer: string;
  type: string;
  priceStart: number; // 2025/1/2 or issue date
  priceRecent: number;
  yield: number; // Percentage
  estYield: number; // Percentage
  returnRate: number; // Percentage
  returnRateWithDiv: number; // Percentage
  issueDate?: string;
  dividendHistory: DividendRecord[]; // New field for history
}

export interface Transaction {
  id: string;
  date: string;
  shares: number;
  price: number;
  fee: number;
  totalCost: number;
}

export interface PortfolioItem {
  code: string;
  name: string;
  transactions: Transaction[];
}

export type ViewState = 'PERFORMANCE' | 'PORTFOLIO' | 'PLANNING' | 'DIAGNOSIS' | 'ANNOUNCEMENTS';