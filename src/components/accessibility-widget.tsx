import { useState, useEffect, useRef } from "react";
import { useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Sparkles,
  Sliders,
  Type,
  Eye,
  Globe,
  Check,
  Moon,
  Sun,
  Accessibility,
  X,
  Link2,
  ZapOff,
  Paintbrush
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const THEME_COLORS = [
  { name: "indigo", class: "bg-indigo-600", label: "Indigo" },
  { name: "emerald", class: "bg-emerald-500", label: "Emerald" },
  { name: "amber", class: "bg-amber-500", label: "Amber" },
  { name: "rose", class: "bg-rose-500", label: "Rose" },
  { name: "cyan", class: "bg-cyan-500", label: "Cyan" },
] as const;

export function AccessibilityWidget() {
  const search = useSearch({ strict: false }) as any;
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { trip, updateTrip } = usePlannerStore();
  const { t, lang } = useTranslation();

  useEffect(() => {
    if (search && search.tour === "accessibility") {
      setIsOpen(true);
    }
  }, [search]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

  const handleDarkModeChange = async (checked: boolean) => {
    await updateTrip({ darkMode: checked });
    toast.success(
      lang === "pl"
        ? `Tryb ciemny: ${checked ? "włączony" : "wyłączony"}`
        : `Dark mode: ${checked ? "enabled" : "disabled"}`
    );
  };

  const handleUnderlineLinksChange = async (checked: boolean) => {
    await updateTrip({ underlineLinks: checked });
    toast.success(
      lang === "pl"
        ? `Podkreślanie linków: ${checked ? "włączone" : "wyłączone"}`
        : `Underline links: ${checked ? "enabled" : "disabled"}`
    );
  };

  const handleDyslexiaFontChange = async (checked: boolean) => {
    await updateTrip({ dyslexiaFont: checked });
    toast.success(
      lang === "pl"
        ? `Czcionka dla dyslektyków: ${checked ? "włączona" : "wyłączona"}`
        : `Dyslexia font: ${checked ? "enabled" : "disabled"}`
    );
  };

  const handleReducedMotionChange = async (checked: boolean) => {
    await updateTrip({ reducedMotion: checked });
    toast.success(
      lang === "pl"
        ? `Redukcja ruchu: ${checked ? "włączona" : "wyłączona"}`
        : `Reduced motion: ${checked ? "enabled" : "disabled"}`
    );
  };

  const handleTextSpacingChange = async (checked: boolean) => {
    await updateTrip({ textSpacing: checked });
    toast.success(
      lang === "pl"
        ? `Zwiększone odstępy tekstu: ${checked ? "włączone" : "wyłączone"}`
        : `Increased text spacing: ${checked ? "enabled" : "disabled"}`
    );
  };

  const handleGrayscaleChange = async (checked: boolean) => {
    await updateTrip({ grayscale: checked });
    toast.success(
      lang === "pl"
        ? `Skala szarości: ${checked ? "włączona" : "wyłączona"}`
        : `Grayscale: ${checked ? "enabled" : "disabled"}`
    );
  };

  const handleDisableAmbientChange = async (checked: boolean) => {
    await updateTrip({ disableAmbient: checked });
    toast.success(
      lang === "pl"
        ? `Efekty tła: ${checked ? "wyłączone" : "włączone"}`
        : `Ambient background: ${checked ? "disabled" : "enabled"}`
    );
  };

  const handleLanguageChange = async (selectedLang: "pl" | "en") => {
    await updateTrip({ language: selectedLang });
    toast.success(selectedLang === "pl" ? "Zmieniono język na Polski" : "Language changed to English");
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`mb-4 w-80 bg-background/95 border shadow-2xl rounded-2xl p-5 text-foreground backdrop-blur-md focus-visible:outline-none transition-all duration-300 ${
              search && search.tour === "accessibility"
                ? "border-primary ring-2 ring-primary ring-offset-2 shadow-primary/20 shadow-2xl animate-pulse"
                : "border-border"
            }`}
            role="dialog"
            aria-label={t("settings.title")}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <span className="flex items-center gap-2 font-bold tracking-tight text-base">
                <Accessibility className="h-5 w-5 text-primary" />
                {t("settings.title")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setIsOpen(false)}
                aria-label="Zamknij menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* 1. Language selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  {t("settings.language")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("pl")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                      lang === "pl"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">🇵🇱</span>
                    Polski (PL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                      lang === "en"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">🇬🇧</span>
                    English (EN)
                  </button>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* 2. Theme color */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("settings.themeColor")}
                </Label>
                <div className="flex gap-2.5 pt-0.5 justify-between">
                  {THEME_COLORS.map((c) => {
                    const active = (trip?.themeColor || "indigo") === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleColorChange(c.name)}
                        className={`h-7 w-7 rounded-full ${c.class} cursor-pointer flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                          active ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                        }`}
                        title={c.label}
                        aria-label={`Zmień motyw na ${c.label}`}
                      >
                        {active && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-border/50" />

              {/* 3. Font Size */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Type className="h-3.5 w-3.5" />
                  {t("settings.fontSize")}
                </Label>
                <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded-lg border border-border">
                  {(["normal", "large", "xlarge"] as const).map((size) => {
                    const active = (trip?.fontSize || "normal") === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleFontSizeChange(size)}
                        className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? "bg-background text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {size === "normal" && t("settings.normal")}
                        {size === "large" && t("settings.large")}
                        {size === "xlarge" && t("settings.xlarge")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-border/50" />

              {/* 4. Toggles */}
              <div className="space-y-3">
                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="widget-dark-mode"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                  >
                    {trip?.darkMode ? (
                      <Moon className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {t("settings.darkMode")}
                  </Label>
                  <Switch
                    id="widget-dark-mode"
                    checked={!!trip?.darkMode}
                    onCheckedChange={handleDarkModeChange}
                  />
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="widget-high-contrast"
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("settings.highContrast")}
                    </Label>
                    <span className="text-[9px] text-muted-foreground leading-none block">
                      {lang === "pl" ? "Zgodność z WCAG AAA" : "WCAG AAA compliance"}
                    </span>
                  </div>
                  <Switch
                    id="widget-high-contrast"
                    checked={!!trip?.highContrast}
                    onCheckedChange={handleHighContrastChange}
                  />
                </div>

                {/* Underline Links */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="widget-underline-links"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    {t("settings.underlineLinks")}
                  </Label>
                  <Switch
                    id="widget-underline-links"
                    checked={!!trip?.underlineLinks}
                    onCheckedChange={handleUnderlineLinksChange}
                  />
                </div>

                {/* Dyslexia Font */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="widget-dyslexia-font"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                  >
                    <Type className="h-3.5 w-3.5 text-primary" />
                    {t("settings.dyslexiaFont")}
                  </Label>
                  <Switch
                    id="widget-dyslexia-font"
                    checked={!!trip?.dyslexiaFont}
                    onCheckedChange={handleDyslexiaFontChange}
                  />
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="widget-reduced-motion"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                  >
                    <ZapOff className="h-3.5 w-3.5 text-primary" />
                    {t("settings.reducedMotion")}
                  </Label>
                  <Switch
                    id="widget-reduced-motion"
                    checked={!!trip?.reducedMotion}
                    onCheckedChange={handleReducedMotionChange}
                  />
                </div>

                {/* Text Spacing */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="widget-text-spacing"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5 text-primary" />
                    {t("settings.textSpacing")}
                  </Label>
                  <Switch
                    id="widget-text-spacing"
                    checked={!!trip?.textSpacing}
                    onCheckedChange={handleTextSpacingChange}
                  />
                </div>

                {/* Grayscale Mode */}
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="widget-grayscale"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                  >
                    <Paintbrush className="h-3.5 w-3.5 text-primary" />
                    {t("settings.grayscale")}
                  </Label>
                  <Switch
                    id="widget-grayscale"
                    checked={!!trip?.grayscale}
                    onCheckedChange={handleGrayscaleChange}
                  />
                </div>

                {/* Disable Ambient Effects */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="widget-disable-ambient"
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {t("settings.disableAmbient")}
                    </Label>
                    <span className="text-[9px] text-muted-foreground leading-none block">
                      {t("settings.disableAmbientDesc")}
                    </span>
                  </div>
                  <Switch
                    id="widget-disable-ambient"
                    checked={!!trip?.disableAmbient}
                    onCheckedChange={handleDisableAmbientChange}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          search && search.tour === "accessibility"
            ? "ring-4 ring-primary ring-offset-2 animate-bounce"
            : ""
        }`}
        title={t("settings.title")}
        aria-label={t("settings.title")}
        aria-expanded={isOpen}
      >
        <Accessibility className="h-6 w-6" />
      </button>
    </div>
  );
}
