import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { usePlannerStore, toEUR } from "@/store/use-planner-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budżet — Erasmus Planner" },
      { name: "description", content: "Planowanie budżetu wyjazdu Erasmus." },
    ],
  }),
  component: BudgetPage,
});

const categories = ["Lot", "Mieszkanie", "Depozyt", "Transport", "Jedzenie", "Ubezpieczenie", "Inne"] as const;
const currencies = ["PLN", "EUR", "USD"] as const;

const schema = z.object({
  title: z.string().trim().min(3, "Tytuł musi mieć minimum 3 znaki"),
  category: z.enum(categories, { message: "Wybierz kategorię" }),
  amount: z.coerce.number().positive("Kwota musi być większa niż 0"),
  currency: z.enum(currencies),
});
type FormValues = z.infer<typeof schema>;

const COLORS = ["#6366f1", "#3b82f6", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#6b7280"];

function BudgetPage() {
  const { expenses, addExpense, deleteExpense, trip } = usePlannerStore();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "Inne", amount: 0, currency: "EUR" },
  });

  const totalEUR = useMemo(
    () => expenses.reduce((sum, e) => sum + toEUR(e.amount, e.currency), 0),
    [expenses],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + toEUR(e.amount, e.currency)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses]);

  const pct = Math.min(100, Math.round((totalEUR / trip.estimatedBudgetEUR) * 100));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Budżet wyjazdu</h2>
          <p className="mt-1 text-muted-foreground">Śledź wydatki i porównuj z planowanym budżetem.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) form.reset(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Dodaj wydatek</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowy wydatek</DialogTitle></DialogHeader>
            <form
              onSubmit={form.handleSubmit(async (v) => {
                await addExpense(v);
                toast.success("Wydatek dodany");
                setOpen(false);
                form.reset();
              })}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Tytuł</Label>
                <Input id="title" {...form.register("title")} />
                {form.formState.errors.title && <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategoria</Label>
                  <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as any)}>
                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Waluta</Label>
                  <Select value={form.watch("currency")} onValueChange={(v) => form.setValue("currency", v as any)}>
                    <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="amount">Kwota</Label>
                <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
                {form.formState.errors.amount && <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Dodaj
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Wydatki</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {expenses.map((e) => (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{e.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{e.category}</Badge>
                        <span className="text-xs text-muted-foreground">≈ {Math.round(toEUR(e.amount, e.currency))} €</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">{e.amount} {e.currency}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Usuń wydatek"
                        onClick={async () => { await deleteExpense(e.id); toast.success("Wydatek usunięty"); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
              {expenses.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">Brak wydatków.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Podsumowanie</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Suma (EUR)</p>
                <p className="text-3xl font-semibold">{Math.round(totalEUR)} €</p>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cel: {trip.estimatedBudgetEUR} €</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-2" aria-label="Procent budżetu" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Podział na kategorie</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v} €`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
