import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Wallet, Info } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { usePlannerStore, toEUR } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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

const currencies = ["PLN", "EUR", "USD"] as const;

const schema = z.object({
  title: z.string().trim().min(3, "Tytuł musi mieć minimum 3 znaki"),
  category: z.string().min(1, "Wybierz kategorię"),
  amount: z.coerce.number().positive("Kwota musi być większa niż 0"),
  currency: z.enum(currencies),
  isMonthly: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const COLORS = ["#6366f1", "#3b82f6", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#ec4899", "#6b7280"];

function BudgetPage() {
  const { expenses, addExpense, deleteExpense, trip, updateTrip } = usePlannerStore();
  const { t, lang } = useTranslation();

  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const defaultCategories = ["Lot", "Mieszkanie", "Depozyt", "Transport", "Jedzenie", "Ubezpieczenie", "Atrakcje", "Inne"];
  const customCategories = trip.budgetCategories || [];
  
  // Merge categories and keep order
  const allCategories = useMemo(() => {
    return Array.from(new Set([...defaultCategories, ...customCategories]));
  }, [customCategories]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "Inne", amount: 0, currency: "EUR", isMonthly: false },
  });

  const durationMonths = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Round up to at least 1 month
    return Math.max(1, Math.round(diffDays / 30));
  }, [trip.startDate, trip.endDate]);

  const totalEUR = useMemo(
    () => expenses.reduce((sum, e) => sum + toEUR(e.amount, e.currency), 0),
    [expenses],
  );

  const projectedTotalEUR = useMemo(() => {
    return expenses.reduce((sum, e) => {
      const amountEUR = toEUR(e.amount, e.currency);
      return sum + (e.isMonthly ? amountEUR * durationMonths : amountEUR);
    }, 0);
  }, [expenses, durationMonths]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const amountEUR = toEUR(e.amount, e.currency);
      // For categories chart, use single amounts representing actual spending
      map.set(e.category, (map.get(e.category) ?? 0) + amountEUR);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses]);

  const pct = Math.min(100, Math.round((totalEUR / trip.estimatedBudgetEUR) * 100));
  const projectedPct = Math.min(100, Math.round((projectedTotalEUR / trip.estimatedBudgetEUR) * 100));

  const handleCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    if (allCategories.includes(name)) {
      toast.error(lang === "pl" ? "Ta kategoria już istnieje" : "Category already exists");
      return;
    }
    const updatedCustom = [...customCategories, name];
    await updateTrip({ budgetCategories: updatedCustom });
    toast.success(lang === "pl" ? `Kategoria "${name}" została utworzona` : `Category "${name}" created`);
    setNewCatName("");
    setCatOpen(false);
    
    // Auto-select the newly created category in the form
    form.setValue("category", name);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{t("budget.title")}</h2>
          <p className="mt-1 text-muted-foreground">{t("budget.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {/* Create Category Trigger */}
          <Dialog open={catOpen} onOpenChange={(o) => { setCatOpen(o); if (!o) setNewCatName(""); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> {t("budget.customCategory")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>{t("budget.customCategory")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newCategoryName">{t("budget.categoryName")}</Label>
                  <Input 
                    id="newCategoryName" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="np. Atrakcje, Pamiątki, Książki..."
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setCatOpen(false)}>
                    {lang === "pl" ? "Anuluj" : "Cancel"}
                  </Button>
                  <Button type="button" onClick={handleCreateCategory}>
                    {t("budget.add")}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Expense Trigger */}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) form.reset(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> {t("budget.addExpense")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("budget.newExpense")}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(async (v) => {
                  await addExpense(v);
                  toast.success(lang === "pl" ? "Wydatek dodany" : "Expense added");
                  setOpen(false);
                  form.reset();
                })}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="title">{t("budget.expenseTitle")}</Label>
                  <Input id="title" {...form.register("title")} />
                  {form.formState.errors.title && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">{t("budget.category")}</Label>
                    <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v)}>
                      <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allCategories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">{t("budget.currency")}</Label>
                    <Select value={form.watch("currency")} onValueChange={(v) => form.setValue("currency", v as any)}>
                      <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="amount">{t("budget.amount")}</Label>
                  <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
                  {form.formState.errors.amount && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>
                  )}
                </div>
                
                {/* Monthly Switch */}
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label htmlFor="isMonthly" className="text-sm font-medium">{t("budget.isMonthly")}</Label>
                    <span className="text-[10px] text-muted-foreground block leading-normal">
                      {lang === "pl" 
                        ? "Wydatek ponoszony co miesiąc, np. wynajem pokoju." 
                        : "Expense incurred monthly, such as room rent."}
                    </span>
                  </div>
                  <Switch
                    id="isMonthly"
                    checked={!!form.watch("isMonthly")}
                    onCheckedChange={(checked) => form.setValue("isMonthly", checked)}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("budget.save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> {t("budget.title")}
            </CardTitle>
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
                        {e.isMonthly && (
                          <Badge variant="outline" className="border-primary text-primary bg-primary/5">
                            {t("budget.monthlyBadge")}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ≈ {Math.round(toEUR(e.amount, e.currency))} €
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold tabular-nums text-sm sm:text-base">
                        {e.amount} {e.currency}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("budget.delete")}
                        onClick={async () => {
                          await deleteExpense(e.id);
                          toast.success(lang === "pl" ? "Wydatek usunięty" : "Expense removed");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
              {expenses.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">{t("budget.noExpenses")}</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Summary / Spent card */}
          <Card>
            <CardHeader><CardTitle>{t("budget.summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("budget.total")}</p>
                <p className="text-3xl font-bold text-foreground">{Math.round(totalEUR)} €</p>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("budget.target")} {trip.estimatedBudgetEUR} €</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-2" aria-label="Procent budżetu" />
              </div>
            </CardContent>
          </Card>

          {/* Budget Forecast (Cykliczne) card */}
          <Card className="relative overflow-hidden border-primary/20 bg-primary/[0.01]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary shrink-0" />
                {t("budget.projectedSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("budget.projectedTotal")}</p>
                <p className="text-3xl font-bold text-primary">{Math.round(projectedTotalEUR)} €</p>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("budget.target")} {trip.estimatedBudgetEUR} €</span>
                  <span className="font-medium">{projectedPct}%</span>
                </div>
                <Progress value={projectedPct} className="mt-2" aria-label="Procent prognozy budżetu" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {t("budget.projectedHint", { months: durationMonths })}
              </p>
            </CardContent>
          </Card>

          {/* Category Breakdown card */}
          <Card>
            <CardHeader><CardTitle>{t("budget.breakdown")}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                {byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v} €`} />
                      <Legend iconSize={8} layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    {lang === "pl" ? "Brak wydatków do wyświetlenia" : "No expenses to show"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
