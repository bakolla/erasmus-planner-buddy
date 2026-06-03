import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, DocumentItem, Expense, TripDetails } from "@/lib/types";
import { seedTasks, seedDocuments, seedExpenses, seedTrip } from "@/lib/seed-data";

// Simulated network latency for the mock API
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

type Status = "idle" | "loading" | "success" | "error";

interface PlannerState {
  tasks: Task[];
  documents: DocumentItem[];
  expenses: Expense[];
  trip: TripDetails;
  status: Status;
  error: string | null;

  // Tasks
  addTask: (t: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;

  // Documents
  addDocument: (d: Omit<DocumentItem, "id">) => Promise<void>;
  updateDocument: (id: string, patch: Partial<DocumentItem>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // Expenses
  addExpense: (e: Omit<Expense, "id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Trip
  updateTrip: (patch: Partial<TripDetails>) => Promise<void>;

  reset: () => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: seedTasks,
      documents: seedDocuments,
      expenses: seedExpenses,
      trip: seedTrip,
      status: "idle",
      error: null,

      addTask: async (t) => {
        set({ status: "loading", error: null });
        try {
          await delay();
          const task: Task = { ...t, id: uid(), createdAt: new Date().toISOString() };
          set({ tasks: [task, ...get().tasks], status: "success" });
        } catch (e) {
          set({ status: "error", error: "Nie udało się dodać zadania" });
        }
      },
      updateTask: async (id, patch) => {
        set({ status: "loading" });
        await delay(200);
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)), status: "success" });
      },
      deleteTask: async (id) => {
        set({ status: "loading" });
        await delay(200);
        set({ tasks: get().tasks.filter((t) => t.id !== id), status: "success" });
      },
      toggleTask: async (id) => {
        const t = get().tasks.find((x) => x.id === id);
        if (!t) return;
        await get().updateTask(id, { status: t.status === "done" ? "todo" : "done" });
      },

      addDocument: async (d) => {
        set({ status: "loading" });
        await delay();
        set({ documents: [{ ...d, id: uid() }, ...get().documents], status: "success" });
      },
      updateDocument: async (id, patch) => {
        await delay(150);
        set({ documents: get().documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
      },
      deleteDocument: async (id) => {
        await delay(150);
        set({ documents: get().documents.filter((d) => d.id !== id) });
      },

      addExpense: async (e) => {
        set({ status: "loading" });
        await delay();
        set({ expenses: [{ ...e, id: uid() }, ...get().expenses], status: "success" });
      },
      deleteExpense: async (id) => {
        await delay(150);
        set({ expenses: get().expenses.filter((e) => e.id !== id) });
      },

      updateTrip: async (patch) => {
        await delay(200);
        set({ trip: { ...get().trip, ...patch } });
      },

      reset: () =>
        set({
          tasks: seedTasks,
          documents: seedDocuments,
          expenses: seedExpenses,
          trip: seedTrip,
          status: "idle",
          error: null,
        }),
    }),
    { name: "erasmus-planner-v1" },
  ),
);

// Helper: convert any expense amount to EUR (rough static rates – mock)
const RATES: Record<string, number> = { EUR: 1, PLN: 0.23, USD: 0.92 };
export const toEUR = (amount: number, currency: string) => amount * (RATES[currency] ?? 1);
