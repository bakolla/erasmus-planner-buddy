import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import type { DocumentStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Dokumenty — Erasmus Planner" },
      { name: "description", content: "Lista dokumentów potrzebnych do wyjazdu." },
    ],
  }),
  component: DocumentsPage,
});

const schema = z.object({
  name: z.string().trim().min(3, "Nazwa musi mieć minimum 3 znaki"),
  category: z.string().trim().min(1, "Kategoria jest wymagana"),
  status: z.enum(["todo", "in_progress", "ready"]),
  deadline: z.string().min(1, "Deadline jest wymagany"),
});
type FormValues = z.infer<typeof schema>;

const statusLabel: Record<DocumentStatus, string> = { todo: "do przygotowania", in_progress: "w trakcie", ready: "gotowe" };
const statusVariant: Record<DocumentStatus, "secondary" | "default" | "outline"> = {
  todo: "secondary",
  in_progress: "default",
  ready: "outline",
};

function DocumentsPage() {
  const { documents, addDocument, updateDocument, deleteDocument } = usePlannerStore();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", category: "", status: "todo", deadline: "" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Dokumenty</h2>
          <p className="mt-1 text-muted-foreground">Pilnuj statusu każdego dokumentu i terminu jego przygotowania.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) form.reset(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Dodaj dokument</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowy dokument</DialogTitle></DialogHeader>
            <form
              onSubmit={form.handleSubmit(async (v) => {
                await addDocument(v);
                toast.success("Dokument dodany");
                setOpen(false);
                form.reset();
              })}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Nazwa</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="category">Kategoria</Label>
                <Input id="category" placeholder="Uczelnia, Zdrowie, Tożsamość…" {...form.register("category")} />
                {form.formState.errors.category && <p className="mt-1 text-xs text-destructive">{form.formState.errors.category.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" {...form.register("deadline")} />
                  {form.formState.errors.deadline && <p className="mt-1 text-xs text-destructive">{form.formState.errors.deadline.message}</p>}
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as DocumentStatus)}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Do przygotowania</SelectItem>
                      <SelectItem value="in_progress">W trakcie</SelectItem>
                      <SelectItem value="ready">Gotowe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

      <ul className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {documents.map((doc) => (
            <motion.li
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium">{doc.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Kategoria: {doc.category}</p>
                      <p className="text-xs text-muted-foreground">Termin: {doc.deadline}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Usuń dokument"
                      onClick={async () => {
                        await deleteDocument(doc.id);
                        toast.success("Dokument usunięty");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={statusVariant[doc.status]}>{statusLabel[doc.status]}</Badge>
                    <Select
                      value={doc.status}
                      onValueChange={async (v) => {
                        await updateDocument(doc.id, { status: v as DocumentStatus });
                        toast.success("Status zaktualizowany");
                      }}
                    >
                      <SelectTrigger className="h-8 w-44" aria-label={`Zmień status dla ${doc.name}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Do przygotowania</SelectItem>
                        <SelectItem value="in_progress">W trakcie</SelectItem>
                        <SelectItem value="ready">Gotowe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {documents.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Brak dokumentów. Dodaj pierwszy!</CardContent></Card>
      )}
    </div>
  );
}
