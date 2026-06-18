import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Paperclip, FileText, Download, X, FileImage, FileCode, Upload } from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import type { DocumentStatus, DocumentAttachment } from "@/lib/types";
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
  const [selectedFiles, setSelectedFiles] = useState<Omit<DocumentAttachment, "id">[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", category: "", status: "todo", deadline: "" },
  });

  const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-500" />;
    if (type === "application/pdf") return <FileText className="h-4 w-4 text-rose-500" />;
    if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return <FileCode className="h-4 w-4 text-green-500" />;
    return <Paperclip className="h-4 w-4 text-muted-foreground" />;
  };

  const handleAddAttachments = async (docId: string, files: FileList) => {
    const newAttachments: DocumentAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Plik "${file.name}" jest za duży. Maksymalny rozmiar to 1.5 MB.`);
        continue;
      }
      try {
        const dataUrl = await fileToBase64(file);
        newAttachments.push({
          id: Math.random().toString(36).slice(2, 10),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
        });
      } catch (err) {
        toast.error(`Błąd wczytywania pliku "${file.name}"`);
      }
    }

    if (newAttachments.length > 0) {
      const currentDoc = documents.find((d) => d.id === docId);
      if (currentDoc) {
        const updatedAttachments = [
          ...(currentDoc.attachments ?? []),
          ...newAttachments,
        ];
        await updateDocument(docId, { attachments: updatedAttachments });
        toast.success("Załączniki dodane pomyślnie");
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Dokumenty</h2>
          <p className="mt-1 text-muted-foreground">Pilnuj statusu każdego dokumentu i terminu jego przygotowania.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { form.reset(); setSelectedFiles([]); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Dodaj dokument</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nowy dokument</DialogTitle></DialogHeader>
            <form
              onSubmit={form.handleSubmit(async (v) => {
                await addDocument({
                  ...v,
                  attachments: selectedFiles.map((file) => ({
                    id: Math.random().toString(36).slice(2, 10),
                    ...file,
                  })),
                });
                toast.success("Dokument dodany");
                setOpen(false);
                form.reset();
                setSelectedFiles([]);
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
              <div>
                <Label>Załączniki</Label>
                <div className="mt-1 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors rounded-lg p-4 text-center cursor-pointer relative bg-muted/20">
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      if (e.target.files) {
                        setUploadingFiles(true);
                        const newFiles: Omit<DocumentAttachment, "id">[] = [];
                        for (let i = 0; i < e.target.files.length; i++) {
                          const file = e.target.files[i];
                          if (file.size > MAX_FILE_SIZE) {
                            toast.error(`Plik "${file.name}" jest za duży. Maksymalny rozmiar to 1.5 MB.`);
                            continue;
                          }
                          try {
                            const dataUrl = await fileToBase64(file);
                            newFiles.push({
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              dataUrl,
                            });
                          } catch (err) {
                            toast.error(`Błąd wczytywania pliku "${file.name}"`);
                          }
                        }
                        setSelectedFiles((prev) => [...prev, ...newFiles]);
                        setUploadingFiles(false);
                      }
                      e.target.value = ""; // Reset
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Upload className="h-6 w-6 text-muted-foreground/60" />
                    <p className="font-medium">Kliknij lub przeciągnij pliki</p>
                    <p className="text-[10px] text-muted-foreground/60">Maksymalny rozmiar: 1.5 MB</p>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getFileIcon(file.type)}
                          <span className="truncate font-medium text-foreground" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="p-1 hover:text-destructive transition-colors shrink-0 rounded hover:bg-background"
                          onClick={() => {
                            setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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

                  {/* Sekcja załączników */}
                  <div className="mt-4 border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Załączniki ({doc.attachments?.length ?? 0})
                      </span>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleAddAttachments(doc.id, e.target.files);
                            }
                            e.target.value = ""; // Reset
                          }}
                        />
                        <span className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 hover:underline gap-1 select-none transition-colors">
                          <Plus className="h-3 w-3" /> Dodaj plik
                        </span>
                      </label>
                    </div>

                    {doc.attachments && doc.attachments.length > 0 ? (
                      <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {doc.attachments.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors text-xs border border-transparent hover:border-muted-foreground/10"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {getFileIcon(file.type)}
                              <span className="truncate font-medium text-foreground" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={file.dataUrl}
                                download={file.name}
                                className="p-1 hover:text-primary transition-colors rounded hover:bg-background"
                                title="Pobierz plik"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                              <button
                                type="button"
                                className="p-1 hover:text-destructive transition-colors rounded hover:bg-background"
                                title="Usuń załącznik"
                                onClick={async () => {
                                  const updated = doc.attachments?.filter((f) => f.id !== file.id) ?? [];
                                  await updateDocument(doc.id, { attachments: updated });
                                  toast.success("Załącznik został usunięty");
                                }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/60 italic text-center py-1.5 bg-muted/10 rounded-md border border-dashed border-muted-foreground/10">
                        Brak załączonych plików
                      </p>
                    )}
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
