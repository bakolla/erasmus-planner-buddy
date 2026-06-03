import type { Task, DocumentItem, Expense, TripDetails } from "./types";

export const seedTrip: TripDetails = {
  country: "Cypr",
  city: "Nicosia",
  institution: "Praktyki w lokalnym studiu projektowym",
  type: "Erasmus praktyki",
  startDate: "2026-06-01",
  endDate: "2026-09-30",
  emergencyContact: "+48 600 700 800 (mama)",
  accommodationAddress: "Ledra Street 42, Nicosia, Cyprus",
  estimatedBudgetEUR: 3500,
};

export const seedTasks: Task[] = [
  { id: "t1", title: "Przygotować dokumenty Erasmus", description: "Learning Agreement, Grant Agreement", deadline: "2026-04-15", priority: "high", status: "in_progress", createdAt: "2026-01-10" },
  { id: "t2", title: "Kupić bilet lotniczy", description: "Najlepiej z Warszawy do Larnaki", deadline: "2026-04-01", priority: "high", status: "todo", createdAt: "2026-01-10" },
  { id: "t3", title: "Znaleźć zakwaterowanie", description: "Mieszkanie w centrum lub blisko firmy", deadline: "2026-05-01", priority: "high", status: "todo", createdAt: "2026-01-10" },
  { id: "t4", title: "Wykupić ubezpieczenie", description: "Ubezpieczenie zdrowotne + NNW", deadline: "2026-05-15", priority: "medium", status: "todo", createdAt: "2026-01-10" },
  { id: "t5", title: "Sprawdzić transport z lotniska", description: "Autobus / taxi / shuttle", deadline: "2026-05-25", priority: "low", status: "todo", createdAt: "2026-01-10" },
  { id: "t6", title: "Spakować najważniejsze rzeczy", deadline: "2026-05-30", priority: "medium", status: "todo", createdAt: "2026-01-10" },
  { id: "t7", title: "Załatwić EKUZ", description: "Europejska Karta Ubezpieczenia Zdrowotnego", deadline: "2026-04-20", priority: "medium", status: "done", createdAt: "2026-01-05" },
];

export const seedDocuments: DocumentItem[] = [
  { id: "d1", name: "Learning Agreement", category: "Uczelnia", status: "in_progress", deadline: "2026-04-15" },
  { id: "d2", name: "Ubezpieczenie zdrowotne", category: "Zdrowie", status: "todo", deadline: "2026-05-15" },
  { id: "d3", name: "Paszport / dowód osobisty", category: "Tożsamość", status: "ready", deadline: "2026-04-01" },
  { id: "d4", name: "Umowa praktyk", category: "Praktyki", status: "in_progress", deadline: "2026-04-30" },
  { id: "d5", name: "Potwierdzenie zakwaterowania", category: "Mieszkanie", status: "todo", deadline: "2026-05-10" },
];

export const seedExpenses: Expense[] = [
  { id: "e1", title: "Bilet lotniczy", category: "Lot", amount: 600, currency: "PLN" },
  { id: "e2", title: "Zakwaterowanie (1 mies.)", category: "Mieszkanie", amount: 450, currency: "EUR" },
  { id: "e3", title: "Depozyt", category: "Depozyt", amount: 450, currency: "EUR" },
  { id: "e4", title: "Transport miejski", category: "Transport", amount: 50, currency: "EUR" },
  { id: "e5", title: "Jedzenie (tydzień)", category: "Jedzenie", amount: 250, currency: "EUR" },
  { id: "e6", title: "Ubezpieczenie", category: "Ubezpieczenie", amount: 180, currency: "EUR" },
];
