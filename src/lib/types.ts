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
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: "PLN" | "EUR" | "USD";
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
}
