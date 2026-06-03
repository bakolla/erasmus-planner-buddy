# Erasmus Planner

Responsywna aplikacja webowa typu dashboard wspierająca studentów w organizacji wyjazdu Erasmus lub praktyk zagranicznych.
Projekt powstał jako końcowy projekt z przedmiotu **Zaawansowany Interfejs Użytkownika**.

## ✨ Funkcje

- **Dashboard** — przegląd wyjazdu, statystyki, najbliższe deadline'y, pasek postępu.
- **Zadania (Checklist)** — dodawanie, edycja, usuwanie, oznaczanie jako wykonane; filtrowanie (wszystkie / aktywne / ukończone); priorytety.
- **Dokumenty** — lista dokumentów z kategorią, statusem (do przygotowania / w trakcie / gotowe) i deadline'm.
- **Budżet** — wydatki w wielu walutach (PLN/EUR/USD), suma w EUR, wykres kołowy podziału na kategorie, porównanie z planowanym budżetem.
- **Szczegóły wyjazdu** — kraj, miasto, uczelnia/firma, daty, kontakt alarmowy, adres zakwaterowania.

## 🛠 Technologie

- **React 19** + **TypeScript**
- **Vite 7** + **TanStack Start / Router** (file-based routing)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **React Hook Form** + **Zod** (walidacja formularzy)
- **Zustand** + `persist` middleware (globalny stan + localStorage)
- **Framer Motion** (animacje, przejścia widoków, mikrointerakcje)
- **Recharts** (wykres budżetu)
- **Sonner** (toast/snackbar)
- **Lucide** (ikony)

## 🧱 Architektura

```
src/
├── components/
│   ├── app-shell.tsx          # Layout: sidebar desktop + hamburger mobile + topbar
│   └── ui/                    # shadcn primitives
├── lib/
│   ├── types.ts               # Typy domenowe (Task, Document, Expense, Trip)
│   └── seed-data.ts           # Dane startowe (Cypr/Nicosia, przykładowe zadania itp.)
├── store/
│   └── use-planner-store.ts   # Zustand store + mock API (delay) + persist
└── routes/
    ├── __root.tsx             # Root layout (AppShell + Toaster)
    ├── index.tsx              # /         Dashboard
    ├── tasks.tsx              # /tasks    Checklist
    ├── documents.tsx          # /documents
    ├── budget.tsx             # /budget
    └── trip.tsx               # /trip     Szczegóły wyjazdu
```

## 🔌 Mock API

Operacje CRUD są zasymulowane w `usePlannerStore` z opóźnieniem (`setTimeout`),
aby naturalnie obsłużyć stany `loading / success / error`. Dane są utrwalane
w `localStorage` przez middleware `persist` Zustand (klucz `erasmus-planner-v1`).

| Operacja | Metoda                          |
| -------- | ------------------------------- |
| GET      | odczyt ze store (inicjalne dane z seed) |
| POST     | `addTask` / `addDocument` / `addExpense` |
| PUT/PATCH| `updateTask` / `updateDocument` / `updateTrip` |
| DELETE   | `deleteTask` / `deleteDocument` / `deleteExpense` |

## ♿ Dostępność (WCAG)

- Semantyczny HTML (`<header>`, `<main>`, `<nav>`, `<ul>`).
- `aria-label` na wszystkich przyciskach z samą ikoną.
- Widoczne komunikaty walidacji pod polami formularza.
- Nawigacja klawiaturą + `focus-visible:ring`.
- Kontrast spełniający WCAG AA (paleta granat/indygo na beżowym tle).

## 🚀 Uruchomienie

```bash
bun install   # albo: npm install
bun dev       # albo: npm run dev
```

Aplikacja dostępna pod adresem `http://localhost:5173`.

### Build produkcyjny

```bash
bun run build
bun run preview
```

## 🌐 Demo

Aplikacja jest gotowa do publikacji przez Lovable Cloud (przycisk **Publish**) —
otrzymasz publiczny adres `*.lovable.app`.
