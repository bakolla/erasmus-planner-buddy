import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Plane, Calendar, Phone, Coins, MapPin, 
  Building2, UserCheck, Pencil, Landmark, Check
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Plane className="h-7 w-7 text-primary" /> {t("trip.title")}
        </h2>
        <p className="mt-1 text-muted-foreground">{t("trip.subtitle")}</p>
      </header>

      {/* Grid of cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 1. Destination card */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={() => handleEditClick("destination")}
          className="cursor-pointer group relative"
        >
          <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                {t("trip.destination")}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
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
          className="cursor-pointer group relative"
        >
          <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {t("trip.dates")}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
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
          className="cursor-pointer group relative"
        >
          <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {t("trip.accommodation")}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
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
          className="cursor-pointer group relative"
        >
          <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                {t("trip.budget")}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
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
