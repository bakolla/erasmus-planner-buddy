import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Sliders,
  Type,
  Eye,
  Globe,
  Link2,
  Plus,
  Trash2,
  Globe2,
  Check,
} from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonalizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const THEME_COLORS = [
  { name: "indigo", class: "bg-indigo-600", label: "Indigo" },
  { name: "emerald", class: "bg-emerald-500", label: "Emerald" },
  { name: "amber", class: "bg-amber-500", label: "Amber" },
  { name: "rose", class: "bg-rose-500", label: "Rose" },
  { name: "cyan", class: "bg-cyan-500", label: "Cyan" },
] as const;

export function PersonalizationModal({ open, onOpenChange }: PersonalizationModalProps) {
  const { trip, updateTrip } = usePlannerStore();
  const { t, lang } = useTranslation();

  // Custom links form state
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const currentLinks = trip?.customLinks || [];

  const handleColorChange = async (color: typeof THEME_COLORS[number]["name"]) => {
    await updateTrip({ themeColor: color });
    toast.success(lang === "pl" ? "Zmieniono kolor motywu" : "Theme color updated");
  };

  const handleFontSizeChange = async (size: "normal" | "large" | "xlarge") => {
    await updateTrip({ fontSize: size });
  };

  const handleHighContrastChange = async (checked: boolean) => {
    await updateTrip({ highContrast: checked });
    toast.success(
      lang === "pl"
        ? `Wysoki kontrast: ${checked ? "włączony" : "wyłączony"}`
        : `High contrast: ${checked ? "enabled" : "disabled"}`
    );
  };

  const handleLanguageChange = async (selectedLang: "pl" | "en") => {
    await updateTrip({ language: selectedLang });
    toast.success(selectedLang === "pl" ? "Zmieniono język na Polski" : "Language changed to English");
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink = {
      id: Math.random().toString(36).slice(2, 9),
      title: linkTitle.trim(),
      url: formattedUrl,
    };

    const updatedLinks = [...currentLinks, newLink];
    await updateTrip({ customLinks: updatedLinks });
    setLinkTitle("");
    setLinkUrl("");
    toast.success(lang === "pl" ? "Dodano ważny link!" : "Link added successfully!");
  };

  const handleDeleteLink = async (linkId: string) => {
    const updatedLinks = currentLinks.filter((l) => l.id !== linkId);
    await updateTrip({ customLinks: updatedLinks });
    toast.success(lang === "pl" ? "Usunięto link" : "Link removed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Sliders className="h-5 w-5 text-primary" />
            {t("settings.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Personalization, accessibility, links, language and colors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* 1. Language selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Globe className="h-4 w-4" />
              {t("settings.language")}
            </Label>
            <Select value={lang} onValueChange={(v) => handleLanguageChange(v as "pl" | "en")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Wybierz język / Choose language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">Polski (PL)</SelectItem>
                <SelectItem value="en">English (EN)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <hr className="border-border/50" />

          {/* 2. Color Theme Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              {t("settings.themeColor")}
            </Label>
            <div className="flex gap-3 pt-1">
              {THEME_COLORS.map((c) => {
                const active = (trip?.themeColor || "indigo") === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleColorChange(c.name)}
                    className={`h-9 w-9 rounded-full ${c.class} cursor-pointer flex items-center justify-center transition-all ${
                      active ? "ring-4 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                    }`}
                    title={c.label}
                    aria-label={`Zmień motyw na ${c.label}`}
                  >
                    {active && <Check className="h-4 w-4 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-border/50" />

          {/* 3. Font Size (WCAG) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Type className="h-4 w-4" />
              {t("settings.fontSize")}
            </Label>
            <Select
              value={trip?.fontSize || "normal"}
              onValueChange={(v) => handleFontSizeChange(v as any)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t("settings.normal")}</SelectItem>
                <SelectItem value="large">{t("settings.large")}</SelectItem>
                <SelectItem value="xlarge">{t("settings.xlarge")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <hr className="border-border/50" />

          {/* 4. High Contrast Switch */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Eye className="h-4 w-4" />
                {t("settings.highContrast")}
              </Label>
              <span className="text-[10px] text-muted-foreground leading-normal block">
                Zwiększa czytelność tekstu (zgodność z wytycznymi WCAG AAA).
              </span>
            </div>
            <Switch
              checked={!!trip?.highContrast}
              onCheckedChange={handleHighContrastChange}
              aria-label="Włącz tryb wysokiego kontrastu"
            />
          </div>

          <hr className="border-border/50" />

          {/* 5. Custom Links Management */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 className="h-4 w-4" />
              {t("settings.customLinks")}
            </Label>

            {/* Links List */}
            {currentLinks.length > 0 && (
              <ul className="border rounded-lg bg-muted/30 divide-y max-h-[140px] overflow-y-auto">
                {currentLinks.map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{l.url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteLink(l.id)}
                      title="Usuń link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Link Form */}
            <form onSubmit={handleAddLink} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Input
                  placeholder={t("settings.linkTitle")}
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div className="flex gap-1.5">
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="text-xs h-8 flex-1"
                />
                <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
