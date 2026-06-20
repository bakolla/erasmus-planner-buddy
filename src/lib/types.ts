export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string; // ISO date
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
}

export type DocumentStatus = "todo" | "in_progress" | "ready";

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  status: DocumentStatus;
  deadline: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: "PLN" | "EUR" | "USD";
  isMonthly?: boolean;
}

export interface TripDetails {
  country: string;
  city: string;
  institution: string;
  type: string;
  startDate: string;
  endDate: string;
  emergencyContact: string;
  accommodationAddress: string;
  estimatedBudgetEUR: number;
  customLinks?: Array<{ id: string; title: string; url: string }>;
  budgetCategories?: string[];
  themeColor?: "indigo" | "emerald" | "amber" | "rose" | "cyan";
  fontSize?: "normal" | "large" | "xlarge";
  highContrast?: boolean;
  language?: "pl" | "en";
}

export interface AccountCredential {
  id: string;
  title: string;       // Plaintext for user navigation
  login: string;       // Encrypted (Base64)
  password?: string;   // Encrypted (Base64)
  url?: string;        // Plaintext
  notes?: string;      // Encrypted (Base64)
}
