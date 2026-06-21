import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Plane, Calendar, Phone, Coins, MapPin, 
  Building2, UserCheck, Pencil, Landmark, Check, AlertTriangle, Shield, X
} from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/trip")({
  head: () => ({
    meta: [
      { title: "Szczegóły wyjazdu — Erasmus Planner" },
      { name: "description", content: "Najważniejsze informacje o wyjeździe." },
    ],
  }),
  component: TripPage,
});

type SectionType = "destination" | "dates" | "contacts" | "budget";

const getDuration = (startStr: string, endStr: string, t: any) => {
  if (!startStr || !endStr) return "-";
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  
  return `${months} ${t("trip.months")} ${remainingDays} ${t("trip.days")} (${diffDays} ${t("trip.days")} ${t("dashboard.ofTotal").replace("z", "")})`;
};

function TripPage() {
  const { trip, updateTrip } = usePlannerStore();
  const { t, lang } = useTranslation();

  const [mainTab, setMainTab] = useState<"details" | "rent" | "emergency">("details");
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);

  // Form schemas based on section
  const schemaMap = {
    destination: z.object({
      country: z.string().trim().min(2, lang === "pl" ? "Wymagane" : "Required"),
      city: z.string().trim().min(2, lang === "pl" ? "Wymagane" : "Required"),
      institution: z.string().trim().min(2, lang === "pl" ? "Wymagane" : "Required"),
      type: z.string().trim().min(2, lang === "pl" ? "Wymagane" : "Required"),
    }),
    dates: z.object({
      startDate: z.string().min(1, lang === "pl" ? "Wymagane" : "Required"),
      endDate: z.string().min(1, lang === "pl" ? "Wymagane" : "Required"),
    }),
    contacts: z.object({
      emergencyContact: z.string().trim().min(3, lang === "pl" ? "Wymagane" : "Required"),
      accommodationAddress: z.string().trim().min(3, lang === "pl" ? "Wymagane" : "Required"),
    }),
    budget: z.object({
      estimatedBudgetEUR: z.coerce.number().positive(lang === "pl" ? "Musi być większe od 0" : "Must be greater than 0"),
    }),
  };

  const form = useForm({
    resolver: zodResolver(
      activeSection ? schemaMap[activeSection] : z.object({})
    ),
    values: trip,
  });

  const handleEditClick = (section: SectionType) => {
    setActiveSection(section);
  };

  const onSubmit = async (values: any) => {
    await updateTrip(values);
    toast.success(lang === "pl" ? "Zapisano szczegóły wyjazdu" : "Trip details updated successfully");
    setActiveSection(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, section: SectionType) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleEditClick(section);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Plane className="h-7 w-7 text-primary" />
            {mainTab === "details" && t("trip.title")}
            {mainTab === "rent" && t("trip.tabRent")}
            {mainTab === "emergency" && t("trip.tabEmergency")}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {mainTab === "details" && t("trip.subtitle")}
            {mainTab === "rent" && t("trip.rentSubtitle")}
            {mainTab === "emergency" && (lang === "pl" ? "Szybki dostęp do kontaktów alarmowych, ambasady i ubezpieczenia." : "Quick access to emergency contacts, embassy, and insurance.")}
          </p>
        </div>

        {/* Main Tab Switch */}
        <div className="flex bg-muted/60 p-1 rounded-lg border border-border/20">
          <button
            onClick={() => setMainTab("details")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mainTab === "details"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("trip.tabDetails")}
          </button>
          <button
            onClick={() => setMainTab("rent")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mainTab === "rent"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("trip.tabRent")}
          </button>
          <button
            onClick={() => setMainTab("emergency")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mainTab === "emergency"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("trip.tabEmergency")}
          </button>
        </div>
      </header>

      {mainTab === "rent" ? (
        <RentVerifier />
      ) : mainTab === "emergency" ? (
        <EmergencyHub />
      ) : (
        <>
          {/* Grid of cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* 1. Destination card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleEditClick("destination")}
              onKeyDown={(e) => handleKeyDown(e, "destination")}
              tabIndex={0}
              role="button"
              aria-label={t("trip.destination") + ". " + (lang === "pl" ? "Kliknij Enter lub Spację aby edytować" : "Press Enter or Space to edit")}
              className="cursor-pointer group relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    {t("trip.destination")}
                  </CardTitle>
                  <Button tabIndex={-1} variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3.5 pt-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{lang === "pl" ? "Kierunek" : "Destination"}</p>
                    <p className="text-lg font-medium text-foreground">{trip.city}, {trip.country}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.institution")}</p>
                      <p className="text-sm font-medium text-foreground/80 truncate" title={trip.institution}>{trip.institution}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.tripType")}</p>
                      <p className="text-sm font-medium text-foreground/80 truncate" title={trip.type}>{trip.type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 2. Dates and duration card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleEditClick("dates")}
              onKeyDown={(e) => handleKeyDown(e, "dates")}
              tabIndex={0}
              role="button"
              aria-label={t("trip.dates") + ". " + (lang === "pl" ? "Kliknij Enter lub Spację aby edytować" : "Press Enter or Space to edit")}
              className="cursor-pointer group relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {t("trip.dates")}
                  </CardTitle>
                  <Button tabIndex={-1} variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3.5 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{lang === "pl" ? "Wyjazd" : "Departure"}</p>
                      <p className="text-sm font-semibold text-foreground">{trip.startDate || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{lang === "pl" ? "Powrót" : "Return"}</p>
                      <p className="text-sm font-semibold text-foreground">{trip.endDate || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.duration")}</p>
                    <p className="text-sm font-medium text-foreground/80">{getDuration(trip.startDate, trip.endDate, t)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3. Emergency & Address card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleEditClick("contacts")}
              onKeyDown={(e) => handleKeyDown(e, "contacts")}
              tabIndex={0}
              role="button"
              aria-label={t("trip.accommodation") + ". " + (lang === "pl" ? "Kliknij Enter lub Spację aby edytować" : "Press Enter or Space to edit")}
              className="cursor-pointer group relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t("trip.accommodation")}
                  </CardTitle>
                  <Button tabIndex={-1} variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3.5 pt-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emergency")}</p>
                    <p className="text-sm font-semibold text-foreground truncate" title={trip.emergencyContact}>
                      {trip.emergencyContact || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{lang === "pl" ? "Adres zakwaterowania" : "Accommodation address"}</p>
                    <p className="text-xs font-medium text-foreground/80 truncate" title={trip.accommodationAddress}>
                      {trip.accommodationAddress || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 4. Finances/Budget card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => handleEditClick("budget")}
              onKeyDown={(e) => handleKeyDown(e, "budget")}
              tabIndex={0}
              role="button"
              aria-label={t("trip.budget") + ". " + (lang === "pl" ? "Kliknij Enter lub Spację aby edytować" : "Press Enter or Space to edit")}
              className="cursor-pointer group relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    {t("trip.budget")}
                  </CardTitle>
                  <Button tabIndex={-1} variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3.5 pt-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{lang === "pl" ? "Szacowany budżet (EUR)" : "Estimated budget (EUR)"}</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{trip.estimatedBudgetEUR} €</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {lang === "pl" 
                      ? "Służy do porównywania Twoich wydatków z limitem w zakładce Budżet." 
                      : "Used to compare your current spending with this limit in the Budget tab."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={activeSection !== null} onOpenChange={(o) => !o && setActiveSection(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              {activeSection === "destination" && t("trip.destination")}
              {activeSection === "dates" && t("trip.dates")}
              {activeSection === "contacts" && t("trip.accommodation")}
              {activeSection === "budget" && t("trip.budget")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {activeSection === "destination" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="country">{lang === "pl" ? "Kraj" : "Country"}</Label>
                    <Input id="country" {...form.register("country")} />
                    {form.formState.errors.country && (
                      <p className="text-xs text-destructive">{form.formState.errors.country.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city">{lang === "pl" ? "Miasto" : "City"}</Label>
                    <Input id="city" {...form.register("city")} />
                    {form.formState.errors.city && (
                      <p className="text-xs text-destructive">{form.formState.errors.city.message as string}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="institution">{t("trip.institution")}</Label>
                  <Input id="institution" {...form.register("institution")} />
                  {form.formState.errors.institution && (
                    <p className="text-xs text-destructive">{form.formState.errors.institution.message as string}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="type">{t("trip.tripType")}</Label>
                  <Input id="type" placeholder={t("trip.studies") + " / " + t("trip.traineeship")} {...form.register("type")} />
                  {form.formState.errors.type && (
                    <p className="text-xs text-destructive">{form.formState.errors.type.message as string}</p>
                  )}
                </div>
              </>
            )}

            {activeSection === "dates" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startDate">{lang === "pl" ? "Data rozpoczęcia" : "Start date"}</Label>
                  <Input id="startDate" type="date" {...form.register("startDate")} />
                  {form.formState.errors.startDate && (
                    <p className="text-xs text-destructive">{form.formState.errors.startDate.message as string}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate">{lang === "pl" ? "Data zakończenia" : "End date"}</Label>
                  <Input id="endDate" type="date" {...form.register("endDate")} />
                  {form.formState.errors.endDate && (
                    <p className="text-xs text-destructive">{form.formState.errors.endDate.message as string}</p>
                  )}
                </div>
              </div>
            )}

            {activeSection === "contacts" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="emergencyContact">{t("trip.emergency")}</Label>
                  <Input id="emergencyContact" {...form.register("emergencyContact")} />
                  {form.formState.errors.emergencyContact && (
                    <p className="text-xs text-destructive">{form.formState.errors.emergencyContact.message as string}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="accommodationAddress">{lang === "pl" ? "Adres zakwaterowania" : "Accommodation address"}</Label>
                  <Input id="accommodationAddress" {...form.register("accommodationAddress")} />
                  {form.formState.errors.accommodationAddress && (
                    <p className="text-xs text-destructive">{form.formState.errors.accommodationAddress.message as string}</p>
                  )}
                </div>
              </>
            )}

            {activeSection === "budget" && (
              <div className="space-y-1">
                <Label htmlFor="estimatedBudgetEUR">{lang === "pl" ? "Szacowany budżet (EUR)" : "Estimated budget (EUR)"}</Label>
                <Input id="estimatedBudgetEUR" type="number" {...form.register("estimatedBudgetEUR")} />
                {form.formState.errors.estimatedBudgetEUR && (
                  <p className="text-xs text-destructive">{form.formState.errors.estimatedBudgetEUR.message as string}</p>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveSection(null)}>
                {lang === "pl" ? "Anuluj" : "Cancel"}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("trip.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

interface Question {
  key: string;
  hintKey: string;
  riskOnYes: boolean;
}

const QUESTIONS: Question[] = [
  { key: "rentQ1", hintKey: "rentQ1Hint", riskOnYes: true },
  { key: "rentQ2", hintKey: "rentQ2Hint", riskOnYes: false },
  { key: "rentQ3", hintKey: "rentQ3Hint", riskOnYes: false },
  { key: "rentQ4", hintKey: "rentQ4Hint", riskOnYes: false },
  { key: "rentQ5", hintKey: "rentQ5Hint", riskOnYes: false },
];

function RentVerifier() {
  const { t, lang } = useTranslation();

  const [answers, setAnswers] = useState<(boolean | null)[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erasmus_rent_verifier_answers");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [null, null, null, null, null];
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erasmus_rent_verifier_step");
      if (saved) {
        const step = parseInt(saved);
        if (!isNaN(step) && step >= 0 && step <= 5) return step;
      }
    }
    return 0;
  });

  useEffect(() => {
    localStorage.setItem("erasmus_rent_verifier_answers", JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem("erasmus_rent_verifier_step", currentStep.toString());
  }, [currentStep]);

  const handleAnswer = (val: boolean) => {
    const nextAnswers = [...answers];
    nextAnswers[currentStep] = val;
    setAnswers(nextAnswers);
    setCurrentStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setAnswers([null, null, null, null, null]);
    setCurrentStep(0);
    toast.success(lang === "pl" ? "Zresetowano test" : "Test reset successfully");
  };

  const handleGoBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const isQ1Risk = answers[0] === true;
  const otherRisksCount = answers.slice(1).filter((a, idx) => {
    const q = QUESTIONS[idx + 1];
    return a === q.riskOnYes;
  }).length;

  const isHighRisk = isQ1Risk || otherRisksCount >= 3;
  const isWarning = !isHighRisk && otherRisksCount > 0;
  const isSafe = !isHighRisk && !isWarning;

  let riskStatus: "safe" | "warning" | "danger" = "safe";
  let statusText = t("trip.rentStatusSafe");
  let statusBg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300";
  let adviceText = t("trip.rentAdviceSafe");

  if (isHighRisk) {
    riskStatus = "danger";
    statusText = t("trip.rentStatusDanger");
    statusBg = "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300";
    adviceText = t("trip.rentAdviceDanger");
  } else if (isWarning) {
    riskStatus = "warning";
    statusText = t("trip.rentStatusWarning");
    statusBg = "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300";
    adviceText = t("trip.rentAdviceWarning");
  }

  if (currentStep < 5) {
    const q = QUESTIONS[currentStep];
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border border-border/50 shadow-md">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {t("trip.rentQuestion", { current: currentStep + 1, total: 5 })}
              </span>
              <div className="w-24 bg-border/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold leading-snug text-foreground">
                {t(`trip.${q.key}`)}
              </h3>
              <p className="text-sm text-muted-foreground bg-muted/40 p-4 rounded-xl border border-border/20 leading-relaxed">
                {t(`trip.${q.hintKey}`)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAnswer(true)}
                className="h-16 text-base font-semibold border-border/60 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
              >
                {lang === "pl" ? "Tak" : "Yes"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAnswer(false)}
                className="h-16 text-base font-semibold border-border/60 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
              >
                {lang === "pl" ? "Nie" : "No"}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                disabled={currentStep === 0}
                className="text-xs"
              >
                {t("trip.rentPrevBtn")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                {lang === "pl" ? "Reset" : "Reset"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border border-border/50 shadow-md">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border/30">
            <h3 className="text-2xl font-bold tracking-tight">{t("trip.rentResultTitle")}</h3>
            <div className={`px-4 py-2 rounded-full border font-extrabold text-sm uppercase tracking-wide ${statusBg}`}>
              {statusText}
            </div>
            <p className="text-sm leading-relaxed max-w-lg mt-2 text-muted-foreground">
              {adviceText}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{lang === "pl" ? "Szczegółowe zestawienie" : "Detailed Report"}</h4>
            <div className="space-y-3">
              {QUESTIONS.map((q, idx) => {
                const answer = answers[idx];
                const isRisk = answer === q.riskOnYes;

                return (
                  <div
                    key={q.key}
                    className={`p-4 rounded-xl border text-sm leading-relaxed ${
                      isRisk
                        ? "bg-red-500/5 border-red-500/10 text-red-950 dark:text-red-300"
                        : "bg-emerald-500/5 border-emerald-500/10 text-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{t(`trip.${q.key}`)}</p>
                        <p className="text-xs text-muted-foreground">{t(`trip.${q.hintKey}`)}</p>
                      </div>
                      <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                        isRisk
                          ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      }`}>
                        {answer === true ? (lang === "pl" ? "Tak" : "Yes") : (lang === "pl" ? "Nie" : "No")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t border-border/30">
            <Button onClick={handleReset} className="font-semibold px-6 cursor-pointer">
              {t("trip.rentResetBtn")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EmergencyNumbers {
  police: string;
  ambulance: string;
  fire: string;
  general: string;
}

const COUNTRY_EMERGENCY_NUMBERS: Record<string, EmergencyNumbers> = {
  Spain: { police: "091", ambulance: "061", fire: "080", general: "112" },
  Hiszpania: { police: "091", ambulance: "061", fire: "080", general: "112" },
  Germany: { police: "110", ambulance: "112", fire: "112", general: "112" },
  Niemcy: { police: "110", ambulance: "112", fire: "112", general: "112" },
  France: { police: "17", ambulance: "15", fire: "18", general: "112" },
  Francja: { police: "17", ambulance: "15", fire: "18", general: "112" },
  Italy: { police: "113", ambulance: "118", fire: "115", general: "112" },
  Włochy: { police: "113", ambulance: "118", fire: "115", general: "112" },
  Poland: { police: "997", ambulance: "999", fire: "998", general: "112" },
  Polska: { police: "997", ambulance: "999", fire: "998", general: "112" },
};

const DEFAULT_EMERGENCY_NUMBERS: EmergencyNumbers = {
  police: "112",
  ambulance: "112",
  fire: "112",
  general: "112",
};

interface EmbassyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
}

const POLISH_EMBASSIES: Record<string, EmbassyDetails> = {
  Spain: {
    name: "Ambasada RP w Madrycie / Embajada de Polonia",
    address: "Calle Guisando 23-25, 28035 Madrid, Spain",
    phone: "+34 913 736 605",
    email: "madryt.amb.sekretariat@msz.gov.pl",
  },
  Hiszpania: {
    name: "Ambasada RP w Madrycie / Embajada de Polonia",
    address: "Calle Guisando 23-25, 28035 Madrid, Hiszpania",
    phone: "+34 913 736 605",
    email: "madryt.amb.sekretariat@msz.gov.pl",
  },
  Germany: {
    name: "Ambasada RP w Berlinie / Polnische Botschaft",
    address: "Lassenstraße 19-21, 14193 Berlin, Germany",
    phone: "+49 30 223130",
    email: "berlin.amb.sekretariat@msz.gov.pl",
  },
  Niemcy: {
    name: "Ambasada RP w Berlinie / Polnische Botschaft",
    address: "Lassenstraße 19-21, 14193 Berlin, Niemcy",
    phone: "+49 30 223130",
    email: "berlin.amb.sekretariat@msz.gov.pl",
  },
  France: {
    name: "Ambasada RP w Paryżu / Ambassade de Pologne",
    address: "1 rue de Talleyrand, 75007 Paris, France",
    phone: "+33 1 43 17 37 00",
    email: "paryz.amb.sekretariat@msz.gov.pl",
  },
  Francja: {
    name: "Ambasada RP w Paryżu / Ambassade de Pologne",
    address: "1 rue de Talleyrand, 75007 Paryż, Francja",
    phone: "+33 1 43 17 37 00",
    email: "paryz.amb.sekretariat@msz.gov.pl",
  },
  Italy: {
    name: "Ambasada RP w Rzymie / Ambasciata di Polonia",
    address: "Via Ximenes 9a, 00197 Roma, Italy",
    phone: "+39 06 362 041",
    email: "roma.amb.sekretariat@msz.gov.pl",
  },
  Włochy: {
    name: "Ambasada RP w Rzymie / Ambasciata di Polonia",
    address: "Via Ximenes 9a, 00197 Rzym, Włochy",
    phone: "+39 06 362 041",
    email: "roma.amb.sekretariat@msz.gov.pl",
  },
};

interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  phone: string;
}

function EmergencyHub() {
  const { trip } = usePlannerStore();
  const { t, lang } = useTranslation();

  const [insurance, setInsurance] = useState<InsuranceDetails>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("erasmus_insurance_details");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return { provider: "", policyNumber: "", phone: "" };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [provider, setProvider] = useState(insurance.provider);
  const [policyNumber, setPolicyNumber] = useState(insurance.policyNumber);
  const [insurancePhone, setInsurancePhone] = useState(insurance.phone);

  const country = trip.country || "";
  const emergency = COUNTRY_EMERGENCY_NUMBERS[country] || DEFAULT_EMERGENCY_NUMBERS;
  const embassy = POLISH_EMBASSIES[country];

  const handleSaveInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { provider, policyNumber, phone: insurancePhone };
    setInsurance(updated);
    localStorage.setItem("erasmus_insurance_details", JSON.stringify(updated));
    setIsEditing(false);
    toast.success(t("trip.emerSavedSuccess"));
  };

  const showForm = isEditing || !insurance.provider;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          {/* Local Emergency numbers */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-rose-500" />
                {t("trip.emerLocalContacts")} ({country})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/40 rounded-xl border border-border/20 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emerGeneral")}</span>
                  <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{emergency.general}</span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/20 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emerPolice")}</span>
                  <span className="text-xl font-bold text-foreground mt-1">{emergency.police}</span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/20 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emerAmbulance")}</span>
                  <span className="text-xl font-bold text-foreground mt-1">{emergency.ambulance}</span>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/20 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emerFire")}</span>
                  <span className="text-xl font-bold text-foreground mt-1">{emergency.fire}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embassy details */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                {t("trip.emerEmbassyTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {embassy ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{embassy.name}</p>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground block">{lang === "pl" ? "Adres" : "Address"}:</span>
                      <span>{embassy.address}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground block">{lang === "pl" ? "Telefon" : "Phone"}:</span>
                      <a href={`tel:${embassy.phone.replace(/\s+/g, "")}`} className="text-primary hover:underline font-medium">
                        {embassy.phone}
                      </a>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground block">E-mail:</span>
                      <a href={`mailto:${embassy.email}`} className="text-primary hover:underline font-medium">
                        {embassy.email}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("trip.emerNoEmbassy")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Insurance Details */}
          <Card className="border border-border/50 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                {t("trip.emerInsuranceTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 flex-1 flex flex-col justify-between">
              {showForm ? (
                <form onSubmit={handleSaveInsurance} className="space-y-4 w-full">
                  <div className="space-y-1">
                    <Label htmlFor="provider">{t("trip.emerProvider")}</Label>
                    <Input
                      id="provider"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      placeholder={lang === "pl" ? "np. NFZ (EKUZ), Allianz, PZU" : "e.g., EHIC, Allianz, AXA"}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="policyNumber">{t("trip.emerPolicyNumber")}</Label>
                    <Input
                      id="policyNumber"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      placeholder={lang === "pl" ? "np. PL 103940204" : "e.g., POL-840294-A"}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="insurancePhone">{t("trip.emerInsurancePhone")}</Label>
                    <Input
                      id="insurancePhone"
                      value={insurancePhone}
                      onChange={(e) => setInsurancePhone(e.target.value)}
                      placeholder="+48 22 123 45 67"
                    />
                  </div>
                  <div className="flex gap-2 pt-2 justify-end">
                    {insurance.provider && (
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        {lang === "pl" ? "Anuluj" : "Cancel"}
                      </Button>
                    )}
                    <Button type="submit">{t("trip.emerSaveBtn")}</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 w-full flex flex-col justify-between h-full">
                  <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border/20">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emerProvider")}</span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{insurance.provider}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emerPolicyNumber")}</span>
                      <p className="text-sm font-medium text-foreground/80 mt-0.5">{insurance.policyNumber}</p>
                    </div>
                    {insurance.phone && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("trip.emerInsurancePhone")}</span>
                        <p className="text-sm font-semibold text-primary hover:underline mt-0.5">
                          <a href={`tel:${insurance.phone.replace(/\s+/g, "")}`}>{insurance.phone}</a>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProvider(insurance.provider);
                        setPolicyNumber(insurance.policyNumber);
                        setInsurancePhone(insurance.phone);
                        setIsEditing(true);
                      }}
                    >
                      {lang === "pl" ? "Edytuj" : "Edit"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/20 text-center leading-relaxed mt-4">
        {t("trip.emerDisclaimer")}
      </div>
    </div>
  );
}
