import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, Download, Paperclip, AlertTriangle, BookOpen, RefreshCw } from "lucide-react";

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

const getSchema = (lang: "pl" | "en") => z.object({
  name: z.string().trim().min(3, lang === "pl" ? "Nazwa musi mieć minimum 3 znaki" : "Name must be at least 3 characters"),
  category: z.string().trim().min(1, lang === "pl" ? "Kategoria jest wymagana" : "Category is required"),
  status: z.enum(["todo", "in_progress", "ready"]),
  deadline: z.string().min(1, lang === "pl" ? "Deadline jest wymagany" : "Deadline is required"),
});
type FormValues = z.infer<ReturnType<typeof getSchema>>;

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
  const [mainTab, setMainTab] = useState<"list" | "la">("list");
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
      let encryptedBlob: Blob | null = null;

      // 1. Try to read from IndexedDB first (even if it's not marked as localdb://)
      try {
        const localFile = await getLocalFile(docItem.id);
        if (localFile) {
          encryptedBlob = new Blob([localFile.bytes], { type: "application/octet-stream" });
        }
      } catch (indexedDbError) {
        console.warn("Failed to retrieve file from IndexedDB cache, trying network/database:", indexedDbError);
      }

      // 2. If not found in IndexedDB cache, fall back to Firestore Base64 or URL fetch
      if (!encryptedBlob) {
        if (docItem.fileUrl === "dbbase64://" && docItem.fileDataB64) {
          // Decode Base64 string back to binary data
          const binaryString = window.atob(docItem.fileDataB64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          encryptedBlob = new Blob([bytes.buffer], { type: "application/octet-stream" });

          // Cache it in IndexedDB for subsequent downloads
          try {
            await saveLocalFile(docItem.id, {
              name: docItem.fileName || "attachment",
              type: docItem.fileType || "application/octet-stream",
              bytes: bytes.buffer,
            });
          } catch (cacheErr) {
            console.warn("Failed to cache retrieved file in IndexedDB:", cacheErr);
          }
        } else if (docItem.fileUrl.startsWith("localdb://")) {
          throw new Error(lang === "pl" ? "Nie znaleziono pliku lokalnego w bazie." : "Local file not found in database.");
        } else {
          const response = await fetch(docItem.fileUrl);
          if (!response.ok) throw new Error(lang === "pl" ? "Nie udało się pobrać pliku." : "Failed to fetch file.");
          encryptedBlob = await response.blob();
        }
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
    resolver: zodResolver(getSchema(lang)),
    defaultValues: { name: "", category: "", status: "todo", deadline: "" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            {mainTab === "list" ? t("documents.title") : t("documents.tabLA")}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {mainTab === "list" ? t("documents.subtitle") : t("documents.laFinalTitle")}
          </p>
        </div>

        {/* Main Tab Switch */}
        <div className="flex bg-muted/60 p-1 rounded-lg border border-border/20">
          <button
            onClick={() => setMainTab("list")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mainTab === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("documents.tabList")}
          </button>
          <button
            onClick={() => setMainTab("la")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mainTab === "la"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("documents.tabLA")}
          </button>
        </div>
      </header>

      {mainTab === "la" ? (
        <LATracker />
      ) : (
        <>
          <div className="flex justify-end mb-4">
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
          </div>

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
                                    e.target.value = "";
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
        </>
      )}
    </div>
  );
}

interface Course {
  id: string;
  name: string;
  ects: number;
}

interface CourseChange {
  id: string;
  type: "add" | "remove";
  courseId?: string;
  addedName?: string;
  addedEcts?: number;
}

const DEFAULT_ORIGINAL_COURSES: Course[] = [
  { id: "oc1", name: "Web Programming", ects: 8 },
  { id: "oc2", name: "Database Systems", ects: 6 },
  { id: "oc3", name: "Machine Learning", ects: 8 },
  { id: "oc4", name: "Academic English", ects: 8 },
];

function LATracker() {
  const { t, lang } = useTranslation();

  const [originalCourses, setOriginalCourses] = useState<Course[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erasmus_la_original_courses");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return DEFAULT_ORIGINAL_COURSES;
  });

  const [courseChanges, setCourseChanges] = useState<CourseChange[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erasmus_la_course_changes");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("erasmus_la_original_courses", JSON.stringify(originalCourses));
  }, [originalCourses]);

  useEffect(() => {
    localStorage.setItem("erasmus_la_course_changes", JSON.stringify(courseChanges));
  }, [courseChanges]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [changeType, setChangeType] = useState<"add" | "remove">("add");
  const [removeCourseId, setRemoveCourseId] = useState<string>("");
  const [addName, setAddName] = useState<string>("");
  const [addEcts, setAddEcts] = useState<number>(6);

  const removedIds = courseChanges
    .filter((c) => c.type === "remove" && c.courseId)
    .map((c) => c.courseId as string);

  const finalOriginalCourses = originalCourses.map((c) => ({
    ...c,
    status: removedIds.includes(c.id) ? "removed" : "kept",
  }));

  const addedCourses = courseChanges
    .filter((c) => c.type === "add")
    .map((c) => ({
      id: c.id,
      name: c.addedName || "",
      ects: c.addedEcts || 0,
      status: "added",
    }));

  const finalCourses = [...finalOriginalCourses, ...addedCourses];

  const totalEcts = finalCourses
    .filter((c) => c.status !== "removed")
    .reduce((sum, c) => sum + c.ects, 0);

  const handleAddChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (changeType === "remove") {
      if (!removeCourseId) {
        toast.error(lang === "pl" ? "Proszę wybrać przedmiot do usunięcia" : "Please select a course to remove");
        return;
      }
      const newChange: CourseChange = {
        id: Math.random().toString(36).substring(2, 9),
        type: "remove",
        courseId: removeCourseId,
      };
      setCourseChanges([...courseChanges, newChange]);
      setRemoveCourseId("");
      toast.success(lang === "pl" ? "Dodano symulację usunięcia przedmiotu" : "Course removal simulation added");
    } else {
      if (!addName.trim()) {
        toast.error(lang === "pl" ? "Proszę podać nazwę przedmiotu" : "Please enter the course name");
        return;
      }
      if (addEcts <= 0) {
        toast.error(lang === "pl" ? "Punkty ECTS muszą być większe od 0" : "ECTS points must be greater than 0");
        return;
      }
      const newChange: CourseChange = {
        id: Math.random().toString(36).substring(2, 9),
        type: "add",
        addedName: addName.trim(),
        addedEcts: addEcts,
      };
      setCourseChanges([...courseChanges, newChange]);
      setAddName("");
      setAddEcts(6);
      toast.success(lang === "pl" ? "Dodano symulację nowego przedmiotu" : "New course simulation added");
    }

    setIsAddOpen(false);
  };

  const handleDeleteChange = (changeId: string) => {
    setCourseChanges(courseChanges.filter((c) => c.id !== changeId));
    toast.success(lang === "pl" ? "Usunięto symulację zmiany" : "Change simulation removed");
  };

  const handleReset = () => {
    setCourseChanges([]);
    setOriginalCourses(DEFAULT_ORIGINAL_COURSES);
    toast.success(lang === "pl" ? "Zresetowano symulator" : "Simulator reset successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-medium tracking-tight">
            {lang === "pl" ? "Symulacja zmian During the Mobility" : "During the Mobility Changes Simulator"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                {t("documents.laAddChangeBtn")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("documents.laAddChangeBtn")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="changeType">{t("documents.laChangeType")}</Label>
                  <Select value={changeType} onValueChange={(v) => setChangeType(v as "add" | "remove")}>
                    <SelectTrigger id="changeType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">{t("documents.laTypeAdd")}</SelectItem>
                      <SelectItem value="remove">{t("documents.laTypeRemove")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {changeType === "remove" ? (
                  <div className="space-y-2">
                    <Label htmlFor="removeCourse">{t("documents.laRemoveCourse")}</Label>
                    <Select value={removeCourseId} onValueChange={setRemoveCourseId}>
                      <SelectTrigger id="removeCourse"><SelectValue placeholder={lang === "pl" ? "Wybierz przedmiot" : "Select a course"} /></SelectTrigger>
                      <SelectContent>
                        {originalCourses
                          .filter((c) => !removedIds.includes(c.id))
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.ects} ECTS)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="addName">{t("documents.laAddCourseName")}</Label>
                      <Input
                        id="addName"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder={lang === "pl" ? "np. Mobile Applications" : "e.g., Mobile Applications"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addEcts">{t("documents.laAddCourseEcts")}</Label>
                      <Input
                        id="addEcts"
                        type="number"
                        min="1"
                        value={addEcts}
                        onChange={(e) => setAddEcts(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </>
                )}

                <DialogFooter>
                  <Button type="submit">{t("documents.save")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {lang === "pl" ? "Reset" : "Reset"}
          </Button>
        </div>
      </div>

      {/* Warnings & Summary */}
      {totalEcts < 30 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-amber-500/30 bg-amber-500/10 p-4 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-sm"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-semibold">{lang === "pl" ? "Niewystarczająca liczba punktów ECTS" : "Insufficient ECTS Points"}</p>
            <p className="mt-1 leading-relaxed">{t("documents.laEctsWarning")}</p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Original list & Changes list */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-semibold text-lg border-b border-border/50 pb-2">{t("documents.laOriginalTitle")}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase">
                      <th className="py-2">{t("documents.laTableCourse")}</th>
                      <th className="py-2 text-right">{t("documents.laTableEcts")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {originalCourses.map((c) => (
                      <tr key={c.id} className="border-b border-border/20 last:border-0">
                        <td className="py-3 font-medium">{c.name}</td>
                        <td className="py-3 text-right font-semibold">{c.ects}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-semibold text-lg border-b border-border/50 pb-2">{t("documents.laChangesTitle")}</h4>
              {courseChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">{t("documents.laNoChanges")}</p>
              ) : (
                <ul className="space-y-2">
                  {courseChanges.map((change) => {
                    const isRemove = change.type === "remove";
                    const refCourse = isRemove
                      ? originalCourses.find((oc) => oc.id === change.courseId)
                      : null;

                    return (
                      <li
                        key={change.id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                          isRemove
                            ? "bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-300"
                            : "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{isRemove ? "-" : "+"}</span>
                          <span>
                            {isRemove
                              ? `${refCourse?.name || "Unknown Course"} (${refCourse?.ects || 0} ECTS)`
                              : `${change.addedName} (${change.addedEcts} ECTS)`}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteChange(change.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Final state summary */}
        <div>
          <Card className="h-full flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col space-y-4">
              <h4 className="font-semibold text-lg border-b border-border/50 pb-2">{t("documents.laFinalTitle")}</h4>
              
              {/* ECTS Ring/Visual */}
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-2xl border border-border/30">
                <span className="text-sm text-muted-foreground font-medium">{t("documents.laEctsSum")}</span>
                <span className={`text-4xl font-extrabold mt-1 ${totalEcts < 30 ? "text-amber-500" : "text-emerald-500"}`}>
                  {totalEcts}
                </span>
                <div className="w-full bg-border/50 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      totalEcts < 30 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (totalEcts / 30) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1.5">{lang === "pl" ? "Wymóg: min. 30 ECTS" : "Requirement: min. 30 ECTS"}</span>
              </div>

              {/* Final Courses list */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
                {finalCourses.map((c) => {
                  const isRemoved = c.status === "removed";
                  const isAdded = c.status === "added";

                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                        isRemoved
                          ? "bg-muted/30 border-dashed border-border/40 opacity-50"
                          : isAdded
                          ? "bg-emerald-500/5 border-emerald-500/10"
                          : "bg-card border-border/30"
                      }`}
                    >
                      <span className={`font-medium truncate max-w-[150px] ${isRemoved ? "line-through text-muted-foreground" : ""}`}>
                        {c.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`font-semibold ${isRemoved ? "text-muted-foreground" : ""}`}>{c.ects} ECTS</span>
                        <Badge
                          variant={isRemoved ? "secondary" : isAdded ? "default" : "outline"}
                          className={`text-[9px] uppercase px-1 py-0.5 ${
                            isAdded ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                          }`}
                        >
                          {isRemoved
                            ? t("documents.laStatusRemoved")
                            : isAdded
                            ? t("documents.laStatusAdded")
                            : t("documents.laStatusKept")}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
