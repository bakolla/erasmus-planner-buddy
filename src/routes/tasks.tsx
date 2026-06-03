import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

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

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Zadania — Erasmus Planner" },
      { name: "description", content: "Checklista przygotowań do wyjazdu Erasmus." },
    ],
  }),
  component: TasksPage,
});

const schema = z.object({
  title: z.string().trim().min(3, "Tytuł musi mieć minimum 3 znaki"),
  description: z.string().max(500).optional(),
  deadline: z.string().min(1, "Deadline jest wymagany"),
  priority: z.enum(["low", "medium", "high"], { message: "Priorytet jest wymagany" }),
  status: z.enum(["todo", "in_progress", "done"]),
});
type FormValues = z.infer<typeof schema>;

const priorityLabel: Record<Priority, string> = { low: "niski", medium: "średni", high: "wysoki" };
const priorityVariant: Record<Priority, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};
const statusLabel: Record<TaskStatus, string> = { todo: "do zrobienia", in_progress: "w trakcie", done: "ukończone" };

function TaskForm({
  initial,
  onSubmit,
  submitLabel,
}: { initial?: Partial<FormValues>; onSubmit: (v: FormValues) => Promise<void> | void; submitLabel: string }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
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
        <Label htmlFor="title">Tytuł</Label>
        <Input id="title" {...form.register("title")} aria-invalid={!!form.formState.errors.title} />
        {form.formState.errors.title && <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Opis</Label>
        <Textarea id="description" rows={3} {...form.register("description")} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" {...form.register("deadline")} aria-invalid={!!form.formState.errors.deadline} />
          {form.formState.errors.deadline && <p className="mt-1 text-xs text-destructive">{form.formState.errors.deadline.message}</p>}
        </div>
        <div>
          <Label htmlFor="priority">Priorytet</Label>
          <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as Priority)}>
            <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Niski</SelectItem>
              <SelectItem value="medium">Średni</SelectItem>
              <SelectItem value="high">Wysoki</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.priority && <p className="mt-1 text-xs text-destructive">{form.formState.errors.priority.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as TaskStatus)}>
          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Do zrobienia</SelectItem>
            <SelectItem value="in_progress">W trakcie</SelectItem>
            <SelectItem value="done">Ukończone</SelectItem>
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
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.status === "done" : t.status !== "done",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Checklista wyjazdu</h2>
          <p className="mt-1 text-muted-foreground">Pilnuj wszystkich spraw w jednym miejscu.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Dodaj zadanie</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowe zadanie</DialogTitle></DialogHeader>
            <TaskForm
              submitLabel="Dodaj"
              onSubmit={async (v) => {
                await addTask(v);
                toast.success("Zadanie dodane");
                setAddOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Wszystkie ({tasks.length})</TabsTrigger>
          <TabsTrigger value="active">Aktywne ({tasks.filter((t) => t.status !== "done").length})</TabsTrigger>
          <TabsTrigger value="done">Ukończone ({tasks.filter((t) => t.status === "done").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie…
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
                      toast.success(task.status === "done" ? "Cofnięto" : "Świetnie, zadanie zrobione!");
                    }}
                    aria-label={`Oznacz "${task.title}" jako wykonane`}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                      <Badge variant={priorityVariant[task.priority]}>{priorityLabel[task.priority]}</Badge>
                      <Badge variant="outline">{statusLabel[task.status]}</Badge>
                    </div>
                    {task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">Termin: {task.deadline}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Edytuj zadanie" onClick={() => setEditing(task)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Usuń zadanie"
                      onClick={async () => {
                        await deleteTask(task.id);
                        toast.success("Zadanie usunięte");
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
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Brak zadań w tej kategorii.</CardContent></Card>
        )}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edytuj zadanie</DialogTitle></DialogHeader>
          {editing && (
            <TaskForm
              initial={editing}
              submitLabel="Zapisz"
              onSubmit={async (v) => {
                await updateTask(editing.id, v);
                toast.success("Zadanie zaktualizowane");
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
