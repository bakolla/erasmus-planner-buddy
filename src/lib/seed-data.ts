import type { Task, DocumentItem, Expense, TripDetails, Recommendation } from "./types";

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
  disableAmbient: false,
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

export const seedRecommendations: Recommendation[] = [
  {
    id: "r1",
    category: "attractions",
    location: "Barcelona",
    title: "Park Guell i Bunkers del Carmel",
    description: "Wspaniale widoki na cale miasto, szczegolnie o zachodzie slonca. Wstep na bunkry jest darmowy, ale warto przyjsc wczesniej.",
    recommendedBy: "kamil_barca"
  },
  {
    id: "r2",
    category: "attractions",
    location: "Hiszpania",
    title: "Tapas w Carrer de Blai",
    description: "Ulica pelna barow pinchos w dzielnicy Poble Sec, gdzie jedno danie kosztuje 1-2 EUR. Idealne, studenckie ceny na kolacje ze znajomymi.",
    recommendedBy: "ola_traveler"
  },
  {
    id: "r3",
    category: "housing",
    location: "Barcelona",
    title: "Pokoje studenckie w dzielnicy Gracia",
    description: "Swietna, bezpieczna dzielnica z artystycznym klimatem i mnostwem placow z kawiarniami. Srednie ceny za pokoj to 450-550 EUR.",
    recommendedBy: "admin_erasmus"
  },
  {
    id: "r4",
    category: "housing",
    location: "Hiszpania",
    title: "Residencia Universitaria Pere Felip Monlau",
    description: "Akademik o wysokim standardzie blisko stacji metra Drassanes w Raval. Rezerwacje trzeba robic z bardzo duzym wyprzedzeniem.",
    recommendedBy: "barcelona_bound"
  },
  {
    id: "r5",
    category: "attractions",
    location: "Cypr",
    title: "Plaza Nissi Beach w Ayia Napa",
    description: "Jedna z najpiekniejszych plaz w Europie z turkusowa woda. Latwy dojazd autobusami Intercity z Nikozji.",
    recommendedBy: "sun_student"
  },
  {
    id: "r6",
    category: "housing",
    location: "Nicosia",
    title: "Pokoje studenckie w dzielnicy Engomi",
    description: "Dzielnica studencka blisko University of Nicosia. Mnostwo knajpek i akademiki od 300 EUR miesiecznie.",
    recommendedBy: "paphos_fan"
  }
];
