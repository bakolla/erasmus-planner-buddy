import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, Download, Paperclip } from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import { decryptFile } from "@/lib/encryption";
import { getLocalFile } from "@/lib/local-files";
import { useTranslation } from "@/lib/i18n";
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

const statusVariant: Record<DocumentStatus, "secondary" | "default" | "outline"> = {
  todo: "secondary",
  in_progress: "default",
  ready: "outline",
};

function DocumentsPage() {
  const {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    uploadDocumentFile,
    deleteDocumentFile,
    encryptionKey,
  } = usePlannerStore();
  
  const { t, lang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const statusLabel: Record<DocumentStatus, string> = {
    todo: t("documents.todo"),
    in_progress: t("documents.inProgress"),
    ready: t("documents.ready"),
  };

  const handleDownloadFile = async (docItem: typeof documents[0]) => {
    if (!docItem.fileUrl) return;
    const key = encryptionKey || "local_default_key";

    setDownloadingDocId(docItem.id);
    try {
      let encryptedBlob: Blob;

      if (docItem.fileUrl.startsWith("localdb://")) {
        const localFile = await getLocalFile(docItem.id);
        if (!localFile) {
          throw new Error(lang === "pl" ? "Nie znaleziono pliku lokalnego w bazie." : "Local file not found in database.");
        }
        encryptedBlob = new Blob([localFile.bytes], { type: "application/octet-stream" });
      } else {
        const response = await fetch(docItem.fileUrl);
        if (!response.ok) throw new Error(lang === "pl" ? "Nie udało się pobrać pliku." : "Failed to fetch file.");
        encryptedBlob = await response.blob();
      }

      const decryptedBlob = await decryptFile(
        encryptedBlob,
        key,
        docItem.fileType || "application/octet-stream"
      );

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docItem.fileName || "zalacznik";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(lang === "pl" ? "Plik został odszyfrowany i pobrany!" : "File decrypted and downloaded!");
    } catch (err: any) {
      console.error(err);
      toast.error(
        lang === "pl" 
          ? "Błąd deszyfracji pliku. Upewnij się, że sejf jest odblokowany." 
          : "File decryption error. Make sure your database is unlocked."
      );
    } finally {
      setDownloadingDocId(null);
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", category: "", status: "todo", deadline: "" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{t("documents.title")}</h2>
          <p className="mt-1 text-muted-foreground">{t("documents.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) form.reset(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t("documents.addDoc")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("documents.newDoc")}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(async (v) => {
                await addDocument(v);
                toast.success(lang === "pl" ? "Dokument dodany" : "Document added");
                setOpen(false);
                form.reset();
              })}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">{t("documents.docName")}</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="category">{t("documents.category")}</Label>
                <Input id="category" placeholder={t("documents.categoryPlaceholder")} {...form.register("category")} />
                {form.formState.errors.category && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">{t("documents.deadline")}</Label>
                  <Input id="deadline" type="date" {...form.register("deadline")} />
                  {form.formState.errors.deadline && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.deadline.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="status">{t("documents.status")}</Label>
                  <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as DocumentStatus)}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">{t("documents.todo")}</SelectItem>
                      <SelectItem value="in_progress">{t("documents.inProgress")}</SelectItem>
                      <SelectItem value="ready">{t("documents.ready")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("documents.save")}
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
                      <p className="mt-1 text-xs text-muted-foreground">{t("documents.category")}: {doc.category}</p>
                      <p className="text-xs text-muted-foreground">{t("documents.deadline")}: {doc.deadline}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("documents.delete")}
                      onClick={async () => {
                        await deleteDocument(doc.id);
                        toast.success(lang === "pl" ? "Dokument usunięty" : "Document removed");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Upload / Attachment section */}
                  <div className="my-4 border-t border-border/50 pt-3">
                    {doc.fileUrl ? (
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate" title={doc.fileName}>
                              {doc.fileName}
                            </p>
                            {doc.fileSize && (
                              <p className="text-[10px] text-muted-foreground">
                                {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                                {doc.fileUrl.startsWith("localdb://") && (
                                  <span className="ml-1 text-primary font-semibold">(Lokalny)</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title={t("documents.download")}
                            onClick={() => handleDownloadFile(doc)}
                            disabled={downloadingDocId === doc.id}
                          >
                            {downloadingDocId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title={t("documents.delete")}
                            onClick={async () => {
                              try {
                                await deleteDocumentFile(doc.id);
                                toast.success(lang === "pl" ? "Załącznik został usunięty" : "Attachment removed");
                              } catch (err) {
                                toast.error(lang === "pl" ? "Nie udało się usunąć załącznika" : "Failed to remove attachment");
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`file-upload-${doc.id}`}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingDocId(doc.id);
                              try {
                                await uploadDocumentFile(doc.id, file);
                                toast.success(lang === "pl" ? "Plik został załączony" : "File attached successfully");
                              } catch (err: any) {
                                toast.error(err.message || (lang === "pl" ? "Błąd podczas przesyłania pliku" : "Error uploading file"));
                              } finally {
                                setUploadingDocId(null);
                              }
                            }}
                            disabled={uploadingDocId !== null}
                          />
                          <Label
                            htmlFor={`file-upload-${doc.id}`}
                            className={`flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-primary hover:text-primary/80 transition-colors ${
                              uploadingDocId !== null ? "pointer-events-none opacity-50" : ""
                            }`}
                          >
                            {uploadingDocId === doc.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>{t("documents.uploading")}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                <span>{t("documents.attachment")}</span>
                              </>
                            )}
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={statusVariant[doc.status]}>{statusLabel[doc.status]}</Badge>
                    <Select
                      value={doc.status}
                      onValueChange={async (v) => {
                        await updateDocument(doc.id, { status: v as DocumentStatus });
                        toast.success(lang === "pl" ? "Status zaktualizowany" : "Status updated");
                      }}
                    >
                      <SelectTrigger className="h-8 w-44" aria-label={`Zmień status dla ${doc.name}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">{t("documents.todo")}</SelectItem>
                        <SelectItem value="in_progress">{t("documents.inProgress")}</SelectItem>
                        <SelectItem value="ready">{t("documents.ready")}</SelectItem>
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
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("documents.noDocs")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
