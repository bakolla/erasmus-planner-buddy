import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Briefcase } from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import type { Priority, TaskStatus, Task } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Zadania — Erasmus Planner" },
      { name: "description", content: "Checklista przygotowań do wyjazdu Erasmus." },
    ],
  }),
  component: TasksPage,
});

const getSchema = (lang: "pl" | "en") => z.object({
  title: z.string().trim().min(3, lang === "pl" ? "Tytuł musi mieć minimum 3 znaki" : "Title must be at least 3 characters long"),
  description: z.string().max(500).optional(),
  deadline: z.string().min(1, lang === "pl" ? "Deadline jest wymagany" : "Deadline is required"),
  priority: z.enum(["low", "medium", "high"], { message: lang === "pl" ? "Priorytet jest wymagany" : "Priority is required" }),
  status: z.enum(["todo", "in_progress", "done"]),
});
type FormValues = z.infer<ReturnType<typeof getSchema>>;

const priorityVariant: Record<Priority, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};

function TaskForm({
  initial,
  onSubmit,
  submitLabel,
}: { initial?: Partial<FormValues>; onSubmit: (v: FormValues) => Promise<void> | void; submitLabel: string }) {
  const { t, lang } = useTranslation();
  const form = useForm<FormValues>({
    resolver: zodResolver(getSchema(lang)),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      deadline: initial?.deadline ?? "",
      priority: (initial?.priority as Priority) ?? "medium",
      status: (initial?.status as TaskStatus) ?? "todo",
    },
  });
  const submitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(async (v) => { await onSubmit(v); })} className="space-y-4">
      <div>
        <Label htmlFor="title">{t("tasks.taskTitle")}</Label>
        <Input id="title" {...form.register("title")} aria-invalid={!!form.formState.errors.title} />
        {form.formState.errors.title && <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">{lang === "pl" ? "Opis" : "Description"}</Label>
        <Textarea id="description" rows={3} {...form.register("description")} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="deadline">{t("tasks.deadline")}</Label>
          <Input id="deadline" type="date" {...form.register("deadline")} aria-invalid={!!form.formState.errors.deadline} />
          {form.formState.errors.deadline && <p className="mt-1 text-xs text-destructive">{form.formState.errors.deadline.message}</p>}
        </div>
        <div>
          <Label htmlFor="priority">{t("tasks.priority")}</Label>
          <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as Priority)}>
            <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t("tasks.low")}</SelectItem>
              <SelectItem value="medium">{t("tasks.medium")}</SelectItem>
              <SelectItem value="high">{t("tasks.high")}</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.priority && <p className="mt-1 text-xs text-destructive">{form.formState.errors.priority.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="status">{t("tasks.status")}</Label>
        <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as TaskStatus)}>
          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">{t("tasks.todo")}</SelectItem>
            <SelectItem value="in_progress">{t("tasks.inProgress")}</SelectItem>
            <SelectItem value="done">{t("tasks.done")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, status } = usePlannerStore();
  const [mainTab, setMainTab] = useState<"tasks" | "packing">("tasks");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const { t, lang } = useTranslation();

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.status === "done" : t.status !== "done",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            {mainTab === "tasks" ? t("tasks.title") : t("tasks.packingTitle")}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {mainTab === "tasks" ? t("tasks.subtitle") : t("tasks.packingSubtitle")}
          </p>
        </div>

        {/* Main Tab Switch */}
        <div className="flex bg-muted/60 p-1 rounded-lg border border-border/20">
          <button
            onClick={() => setMainTab("tasks")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mainTab === "tasks"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("tasks.tabTasks")}
          </button>
          <button
            onClick={() => setMainTab("packing")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mainTab === "packing"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("tasks.tabPacking")}
          </button>
        </div>
      </header>

      {mainTab === "tasks" ? (
        <>
          <div className="flex justify-end">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> {t("tasks.addTask")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("tasks.newTask")}</DialogTitle></DialogHeader>
                <TaskForm
                  submitLabel={lang === "pl" ? "Dodaj" : "Add"}
                  onSubmit={async (v) => {
                    await addTask(v);
                    toast.success(t("tasks.toastAdded"));
                    setAddOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">{t("tasks.filterAll")} ({tasks.length})</TabsTrigger>
              <TabsTrigger value="active">{t("tasks.filterActive")} ({tasks.filter((t) => t.status !== "done").length})</TabsTrigger>
              <TabsTrigger value="done">{t("tasks.filterCompleted")} ({tasks.filter((t) => t.status === "done").length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("tasks.saving")}
            </div>
          )}

          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((task) => (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-start gap-3 p-4">
                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={() => {
                          toggleTask(task.id);
                          toast.success(task.status === "done" ? t("tasks.toastToggledUndone") : t("tasks.toastToggledDone"));
                        }}
                        aria-label={lang === "pl" ? `Oznacz "${task.title}" jako wykonane` : `Mark "${task.title}" as completed`}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                          <Badge variant={priorityVariant[task.priority]}>{t(`tasks.${task.priority}`)}</Badge>
                          <Badge variant="outline">{t(`tasks.${task.status === "in_progress" ? "inProgress" : task.status}`)}</Badge>
                        </div>
                        {task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{t("tasks.deadline")}: {task.deadline}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={lang === "pl" ? "Edytuj zadanie" : "Edit task"} onClick={() => setEditing(task)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={lang === "pl" ? "Usuń zadanie" : "Delete task"}
                          onClick={async () => {
                            await deleteTask(task.id);
                            toast.success(t("tasks.toastRemoved"));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.li>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t("tasks.noTasks")}</CardContent></Card>
            )}
          </ul>

          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>{lang === "pl" ? "Edytuj zadanie" : "Edit task"}</DialogTitle></DialogHeader>
              {editing && (
                <TaskForm
                  initial={editing}
                  submitLabel={t("tasks.save")}
                  onSubmit={async (v) => {
                    await updateTask(editing.id, v);
                    toast.success(t("tasks.toastUpdated"));
                    setEditing(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <PackingAssistant />
      )}
    </div>
  );
}

interface PackingItem {
  id: string;
  title: string;
  category: string;
  packed: boolean;
}

const PACKING_TEMPLATES = {
  documents: [
    { pl: "Paszport / Dowód osobisty", en: "Passport / ID card" },
    { pl: "Learning Agreement (podpisany)", en: "Learning Agreement (signed)" },
    { pl: "Karta EKUZ (lub polisa prywatna)", en: "EHIC Card (or private insurance)" },
    { pl: "List akceptacyjny z uczelni partnerskiej", en: "Letter of Acceptance" },
    { pl: "Karta płatnicza walutowa (np. Revolut)", en: "Multi-currency bank card" },
    { pl: "Potwierdzenie zakwaterowania", en: "Accommodation confirmation" }
  ],
  electronics: [
    { pl: "Laptop i ładowarka", en: "Laptop and charger" },
    { pl: "Telefon i ładowarka", en: "Phone and charger" },
    { pl: "Powerbank", en: "Powerbank" },
    { pl: "Adapter wtyczki sieciowej", en: "Plug adapter (if required)" },
    { pl: "Słuchawki", en: "Headphones" }
  ],
  hygiene: [
    { pl: "Szczoteczka i pasta do zębów", en: "Toothbrush and toothpaste" },
    { pl: "Podręczna apteczka (leki, plastry)", en: "First-aid kit (meds, band-aids)" },
    { pl: "Kosmetyki podróżne", en: "Travel toiletries" },
    { pl: "Ręcznik szybkoschnący", en: "Quick-dry towel" }
  ],
  clothing: {
    warm: [
      { pl: "Okulary przeciwsłoneczne", en: "Sunglasses" },
      { pl: "Krótkie spodenki i t-shirty", en: "Shorts and t-shirts" },
      { pl: "Strój kąpielowy", en: "Swimwear" },
      { pl: "Klapki i sandały", en: "Flip-flops and sandals" }
    ],
    moderate: [
      { pl: "Wygodne buty sportowe", en: "Comfortable sneakers" },
      { pl: "Długie spodnie i jeansy", en: "Trousers and jeans" },
      { pl: "Bluza z kapturem / sweter", en: "Warm hoodie / sweater" },
      { pl: "Kurtka przeciwdeszczowa", en: "Rain jacket" }
    ],
    cold: [
      { pl: "Ciepła kurtka zimowa", en: "Warm winter jacket" },
      { pl: "Czapka, szalik i rękawiczki", en: "Winter cap, scarf, and gloves" },
      { pl: "Bielizna termiczna", en: "Thermal underwear" },
      { pl: "Buty zimowe / wodoodporne", en: "Waterproof boots" }
    ]
  },
  misc: [
    { pl: "Plecak na co dzień", en: "Everyday backpack" },
    { pl: "Butelka filtrująca wielorazowa", en: "Reusable water bottle" },
    { pl: "Poduszka podróżna (rogal)", en: "Travel neck pillow" },
    { pl: "Zeszyt i długopis", en: "Notebook and pen" }
  ]
};

function PackingAssistant() {
  const { t, lang } = useTranslation();
  const [climate, setClimate] = useState<"warm" | "moderate" | "cold">("moderate");
  const [season, setSeason] = useState<"winter" | "summer" | "full">("winter");

  const [items, setItems] = useState<PackingItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erasmus_packing_list");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("misc");

  useEffect(() => {
    localStorage.setItem("erasmus_packing_list", JSON.stringify(items));
  }, [items]);

  const handleGenerate = () => {
    const generated: PackingItem[] = [];

    const pushItems = (list: Array<{ pl: string; en: string }>, cat: string) => {
      list.forEach((item) => {
        generated.push({
          id: Math.random().toString(36).slice(2, 9),
          title: lang === "pl" ? item.pl : item.en,
          category: cat,
          packed: false
        });
      });
    };

    pushItems(PACKING_TEMPLATES.documents, "docs");
    pushItems(PACKING_TEMPLATES.electronics, "electronics");
    pushItems(PACKING_TEMPLATES.hygiene, "hygiene");

    if (climate === "warm") {
      pushItems(PACKING_TEMPLATES.clothing.warm, "clothing");
      pushItems(PACKING_TEMPLATES.clothing.moderate, "clothing");
    } else if (climate === "cold") {
      pushItems(PACKING_TEMPLATES.clothing.cold, "clothing");
      pushItems(PACKING_TEMPLATES.clothing.moderate, "clothing");
    } else {
      pushItems(PACKING_TEMPLATES.clothing.moderate, "clothing");
    }

    if (season === "winter" && climate !== "warm") {
      pushItems([{ pl: "Parasol składany", en: "Foldable umbrella" }, { pl: "Ciepłe domowe skarpety", en: "Thick home socks" }], "clothing");
    } else if (season === "summer") {
      pushItems([{ pl: "Krem z filtrem UV", en: "Sunscreen lotion" }, { pl: "Ręcznik plażowy", en: "Beach towel" }], "hygiene");
    } else if (season === "full") {
      pushItems(PACKING_TEMPLATES.clothing.warm, "clothing");
      pushItems(PACKING_TEMPLATES.clothing.cold, "clothing");
      pushItems(PACKING_TEMPLATES.clothing.moderate, "clothing");
    }

    pushItems(PACKING_TEMPLATES.misc, "misc");

    setItems(generated);
    toast.success(lang === "pl" ? "Wygenerowano listę pakowania!" : "Packing list generated!");
  };

  const handleToggle = (id: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, packed: !item.packed } : item));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: PackingItem = {
      id: Math.random().toString(36).slice(2, 9),
      title: newItemTitle.trim(),
      category: newItemCategory,
      packed: false
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemTitle("");
    toast.success(lang === "pl" ? "Dodano własną pozycję" : "Custom item added");
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setItems([]);
    localStorage.removeItem("erasmus_packing_list");
  };

  const categories = [
    { key: "docs", label: t("tasks.packingCatDocs") },
    { key: "clothing", label: t("tasks.packingCatClothing") },
    { key: "electronics", label: t("tasks.packingCatElectronics") },
    { key: "hygiene", label: t("tasks.packingCatHygiene") },
    { key: "misc", label: t("tasks.packingCatMisc") }
  ];

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.packed).length;
  const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <Card className="border border-border/50 bg-card/50 shadow-md">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("tasks.packingTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("tasks.packingSubtitle")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-xl mx-auto pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="climate-select" className="text-xs font-semibold text-muted-foreground">{t("tasks.packingClimate")}</Label>
                <Select value={climate} onValueChange={(v) => setClimate(v as any)}>
                  <SelectTrigger id="climate-select" className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="warm">{t("tasks.packingWarm")}</SelectItem>
                    <SelectItem value="moderate">{t("tasks.packingModerate")}</SelectItem>
                    <SelectItem value="cold">{t("tasks.packingCold")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="season-select" className="text-xs font-semibold text-muted-foreground">{t("tasks.packingSeason")}</Label>
                <Select value={season} onValueChange={(v) => setSeason(v as any)}>
                  <SelectTrigger id="season-select" className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="winter">{t("tasks.packingWinter")}</SelectItem>
                    <SelectItem value="summer">{t("tasks.packingSummer")}</SelectItem>
                    <SelectItem value="full">{t("tasks.packingFullYear")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={handleGenerate} className="px-6 font-semibold shadow shadow-primary/20 text-xs h-9 cursor-pointer">
                {t("tasks.packingGenerateBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <div className="space-y-4 md:col-span-1">
            <Card className="border border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t("dashboard.progress")}</h4>
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span>{t("tasks.packingProgress")}</span>
                    <span>{packedItems} / {totalItems} ({progress}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <hr className="border-border/30" />

                <form onSubmit={handleAddCustom} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{lang === "pl" ? "Dodaj własny przedmiot" : "Add custom item"}</h4>
                  <div className="space-y-1">
                    <Label htmlFor="item-title" className="sr-only">Nazwa przedmiotu</Label>
                    <Input
                      id="item-title"
                      placeholder={t("tasks.packingAddPlaceholder")}
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      className="text-xs bg-background/50 h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="item-category" className="sr-only">Kategoria</Label>
                    <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                      <SelectTrigger id="item-category" className="text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent className="text-xs">
                        {categories.map((cat) => (
                          <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" size="sm" className="w-full text-xs font-semibold cursor-pointer">
                    <Plus className="h-3.5 w-3.5 mr-1" /> {lang === "pl" ? "Dodaj" : "Add"}
                  </Button>
                </form>

                <hr className="border-border/30" />

                <Button variant="outline" size="sm" onClick={handleReset} className="w-full text-xs hover:bg-destructive/10 hover:text-destructive border-border/60 cursor-pointer">
                  {t("tasks.packingResetBtn")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 md:col-span-2">
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category === cat.key);
              if (catItems.length === 0) return null;

              return (
                <Card key={cat.key} className="border border-border/40 shadow-sm bg-card/40">
                  <CardContent className="p-4">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 border-b border-border/20 pb-1.5">{cat.label}</h3>
                    <ul className="divide-y divide-border/20">
                      {catItems.map((item) => (
                        <li key={item.id} className="flex items-center justify-between py-2 group">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Checkbox
                              checked={item.packed}
                              onCheckedChange={() => handleToggle(item.id)}
                              id={`pack-item-${item.id}`}
                            />
                            <Label
                              htmlFor={`pack-item-${item.id}`}
                              className={`text-xs font-medium truncate cursor-pointer leading-none ${
                                item.packed ? "line-through text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {item.title}
                            </Label>
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 cursor-pointer"
                            title={lang === "pl" ? "Usuń" : "Delete"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
