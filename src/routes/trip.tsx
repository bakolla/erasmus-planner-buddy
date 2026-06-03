import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plane } from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/trip")({
  head: () => ({
    meta: [
      { title: "Szczegóły wyjazdu — Erasmus Planner" },
      { name: "description", content: "Najważniejsze informacje o wyjeździe." },
    ],
  }),
  component: TripPage,
});

const schema = z.object({
  country: z.string().trim().min(2, "Wymagane"),
  city: z.string().trim().min(2, "Wymagane"),
  institution: z.string().trim().min(2, "Wymagane"),
  type: z.string().trim().min(2, "Wymagane"),
  startDate: z.string().min(1, "Wymagane"),
  endDate: z.string().min(1, "Wymagane"),
  emergencyContact: z.string().trim().min(3, "Wymagane"),
  accommodationAddress: z.string().trim().min(3, "Wymagane"),
  estimatedBudgetEUR: z.coerce.number().positive("Kwota musi być większa niż 0"),
});
type FormValues = z.infer<typeof schema>;

function TripPage() {
  const { trip, updateTrip } = usePlannerStore();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: trip,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Plane className="h-7 w-7 text-primary" /> Szczegóły wyjazdu
        </h2>
        <p className="mt-1 text-muted-foreground">Najważniejsze dane w jednym miejscu. Zapisuje się lokalnie.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Informacje podstawowe</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(async (v) => {
              await updateTrip(v);
              toast.success("Zapisano zmiany");
            })}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {([
              ["country", "Kraj"],
              ["city", "Miasto"],
              ["institution", "Uczelnia / firma"],
              ["type", "Typ wyjazdu"],
              ["startDate", "Data wyjazdu", "date"],
              ["endDate", "Data powrotu", "date"],
              ["emergencyContact", "Kontakt alarmowy"],
              ["accommodationAddress", "Adres zakwaterowania"],
              ["estimatedBudgetEUR", "Szacowany budżet (EUR)", "number"],
            ] as const).map(([name, label, type]) => (
              <div key={name} className={name === "accommodationAddress" ? "sm:col-span-2" : ""}>
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} type={type ?? "text"} {...form.register(name as any)} />
                {form.formState.errors[name as keyof FormValues] && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors[name as keyof FormValues]?.message as string}
                  </p>
                )}
              </div>
            ))}
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz zmiany
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
