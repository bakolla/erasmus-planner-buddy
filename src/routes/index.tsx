import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { usePlannerStore, toEUR } from "@/store/use-planner-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListChecks, FileText, Wallet, CheckCircle2, CalendarClock, Plane, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Erasmus Planner" },
      { name: "description", content: "Zaplanuj swój wyjazd Erasmus: zadania, dokumenty, budżet i terminy." },
      { property: "og:title", content: "Erasmus Planner — Dashboard" },
      { property: "og:description", content: "Zaplanuj swój wyjazd Erasmus: zadania, dokumenty, budżet i terminy." },
    ],
  }),
  component: Index,
});

function StatCard({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string | number; hint?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
              {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Index() {
  const { tasks, documents, expenses, trip } = usePlannerStore();
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const docsTodo = documents.filter((d) => d.status !== "ready").length;
  const totalEUR = Math.round(expenses.reduce((sum, e) => sum + toEUR(e.amount, e.currency), 0));

  const upcoming = [...tasks, ...documents.map((d) => ({ id: d.id, title: d.name, deadline: d.deadline, status: d.status, kind: "doc" as const }))]
    .map((x: any) => ({ id: x.id, title: x.title, deadline: x.deadline, kind: x.kind ?? "task", status: x.status }))
    .filter((x) => x.status !== "done" && x.status !== "ready")
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <p className="text-sm text-muted-foreground">Cześć, podróżniku 👋</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Twój wyjazd do {trip.city}, {trip.country}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {trip.type} — od {trip.startDate} do {trip.endDate}. Trzymamy kciuki, żeby wszystko poszło gładko.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" /> {trip.city}</Badge>
          <Badge variant="secondary" className="gap-1"><Plane className="h-3 w-3" /> {trip.type}</Badge>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Wszystkie zadania" value={total} hint={`${done} ukończonych`} />
        <StatCard icon={CheckCircle2} label="Ukończone" value={done} hint={`${progress}% gotowe`} />
        <StatCard icon={FileText} label="Dokumenty do przygotowania" value={docsTodo} hint={`z ${documents.length} łącznie`} />
        <StatCard icon={Wallet} label="Szacowany budżet" value={`${totalEUR} €`} hint={`cel: ${trip.estimatedBudgetEUR} €`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Najbliższe deadline'y</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak nadchodzących terminów. Świetna robota!</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={u.kind === "task" ? "default" : "secondary"}>{u.kind === "task" ? "Zadanie" : "Dokument"}</Badge>
                      <span className="text-sm font-medium">{u.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{u.deadline}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Postęp przygotowań</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Zadania</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-2" aria-label={`Postęp ${progress}%`} />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild><Link to="/tasks">Otwórz checklistę</Link></Button>
              <Button asChild variant="outline"><Link to="/budget">Sprawdź budżet</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
