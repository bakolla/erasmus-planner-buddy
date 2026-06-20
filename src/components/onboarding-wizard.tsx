import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Briefcase,
  Calendar,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Lock,
  Mail,
  FileText,
  Coins,
  Loader2,
  Building,
} from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import { db } from "@/lib/firebase";
import type { DocumentItem, Expense, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { doc, writeBatch } from "firebase/firestore";

const uid = () => Math.random().toString(36).slice(2, 10);

const DOC_TEMPLATES = {
  studies: [
    { name: "Learning Agreement (LA) - przed wyjazdem", category: "Uczelnia macierzysta", required: true },
    { name: "Umowa finansowa z uczelnią", category: "Stypendium", required: true },
    { name: "Karta EKUZ (Ubezpieczenie zdrowotne)", category: "Zdrowie", required: true },
    { name: "Zgoda dziekana na wyjazd", category: "Uczelnia macierzysta", required: false },
    { name: "Confirmation of Arrival - po przyjeździe", category: "Uczelnia przyjmująca", required: true },
    { name: "Learning Agreement - Changes (w trakcie)", category: "Uczelnia przyjmująca", required: false },
    { name: "Transcript of Records (na koniec)", category: "Uczelnia przyjmująca", required: true },
  ],
  traineeship: [
    { name: "Learning Agreement for Traineeships", category: "Uczelnia macierzysta", required: true },
    { name: "Umowa o praktyki (Traineeship Agreement)", category: "Firma / Pracodawca", required: true },
    { name: "Ubezpieczenie OC i NW (wymagane na praktykach)", category: "Ubezpieczenie", required: true },
    { name: "Karta EKUZ (Ubezpieczenie zdrowotne)", category: "Zdrowie", required: true },
    { name: "List akceptacyjny od pracodawcy", category: "Firma / Pracodawca", required: false },
    { name: "Certyfikat odbycia praktyk (Traineeship Certificate)", category: "Firma / Pracodawca", required: true },
  ],
};

const EXPENSE_TEMPLATES = [
  { title: "Kaucja za pokój/mieszkanie", amount: 450, selected: true },
  { title: "Bilety lotnicze / podróż", amount: 150, selected: true },
  { title: "Ubezpieczenie turystyczne/dodatkowe", amount: 40, selected: false },
  { title: "Karta miejska / bilet miesięczny", amount: 35, selected: true },
  { title: "Pierwsze zakupy (zakwaterowanie, pościel)", amount: 100, selected: true },
];

export function OnboardingWizard() {
  const { signUp } = usePlannerStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account Info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Trip Info
  const [tripType, setTripType] = useState<"studies" | "traineeship">("studies");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [institution, setInstitution] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 3: Documents Checklist
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Step 4: Budget Setup
  const [grantGroup, setGrantGroup] = useState<"1" | "2" | "3" | "custom">("2");
  const [monthlyRate, setMonthlyRate] = useState(670);
  const [customTotalBudget, setCustomTotalBudget] = useState("");
  const [durationMonths, setDurationMonths] = useState(5);

  // Step 5: Initial Expenses
  const [selectedExpenses, setSelectedExpenses] = useState<Array<{ title: string; amount: number }>>([]);

  // Set default documents when tripType changes
  useEffect(() => {
    const templates = DOC_TEMPLATES[tripType];
    setSelectedDocs(templates.map((d) => d.name));
  }, [tripType]);

  // Set default expenses on mount
  useEffect(() => {
    setSelectedExpenses(EXPENSE_TEMPLATES.filter(e => e.selected).map(e => ({ title: e.title, amount: e.amount })));
  }, []);

  // Recalculate duration and default monthly rates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = Math.round((diffDays / 30) * 10) / 10;
      setDurationMonths(months > 0 ? months : 1);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (grantGroup === "custom") return;

    let rate = 670; // Group 2 Studies
    if (tripType === "studies") {
      if (grantGroup === "1") rate = 670;
      else if (grantGroup === "2") rate = 670;
      else if (grantGroup === "3") rate = 600;
    } else {
      // Traineeships get additional 150 EUR usually
      if (grantGroup === "1") rate = 820;
      else if (grantGroup === "2") rate = 820;
      else if (grantGroup === "3") rate = 750;
    }
    setMonthlyRate(rate);
  }, [grantGroup, tripType]);

  const totalCalculatedGrant = Math.round(durationMonths * monthlyRate);
  const totalBudget = grantGroup === "custom" && customTotalBudget ? Number(customTotalBudget) : totalCalculatedGrant;

  const nextStep = () => {
    if (step === 1) {
      if (!email.trim() || !password.trim()) {
        toast.error("Wprowadź e-mail oraz hasło!");
        return;
      }
      if (password.length < 6) {
        toast.error("Hasło musi mieć co najmniej 6 znaków!");
        return;
      }
    }
    if (step === 2) {
      if (!country.trim() || !city.trim() || !institution.trim() || !startDate || !endDate) {
        toast.error("Wypełnij wszystkie szczegóły wyjazdu!");
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        toast.error("Data zakończenia musi być po dacie rozpoczęcia!");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const toggleDoc = (docName: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docName) ? prev.filter((d) => d !== docName) : [...prev, docName]
    );
  };

  const toggleExpense = (title: string, amount: number) => {
    setSelectedExpenses((prev) => {
      const exists = prev.find((e) => e.title === title);
      if (exists) {
        return prev.filter((e) => e.title !== title);
      } else {
        return [...prev, { title, amount }];
      }
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Sign up the user (triggers storage of key in sessionStorage)
      await signUp(email.trim(), password);

      // 2. Fetch the newly logged-in user's UID from store state or directly from auth
      const userId = usePlannerStore.getState().user?.uid;

      if (!userId || !db) {
        throw new Error("Błąd autoryzacji Firebase. Spróbuj zalogować się ponownie.");
      }

      // 3. Format documents, expenses, and default tasks
      const formattedDocs: DocumentItem[] = selectedDocs.map((name) => {
        const template = DOC_TEMPLATES[tripType].find((t) => t.name === name);
        return {
          id: uid(),
          name,
          category: template?.category || "Formalności",
          status: "todo",
          deadline: startDate,
        };
      });

      const formattedExpenses: Expense[] = selectedExpenses.map((exp) => ({
        id: uid(),
        title: exp.title,
        category: "Na start",
        amount: exp.amount,
        currency: "EUR",
      }));

      const defaultTasks: Task[] = [
        {
          id: uid(),
          title: "Podpisać i przesłać Learning Agreement",
          deadline: startDate,
          priority: "high",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: "Uzyskać ubezpieczenie zdrowotne (EKUZ / prywatne)",
          deadline: startDate,
          priority: "high",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: "Zarezerwować zakwaterowanie na miejscu",
          deadline: startDate,
          priority: "high",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: "Kupić bilety na transport",
          deadline: startDate,
          priority: "medium",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: "Skontaktować się z koordynatorem uczelni przyjmującej",
          deadline: startDate,
          priority: "low",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
      ];

      const tripDetails = {
        country: country.trim(),
        city: city.trim(),
        institution: institution.trim(),
        type: tripType === "studies" ? "Studia Erasmus+" : "Praktyki Erasmus+",
        startDate,
        endDate,
        emergencyContact: "",
        accommodationAddress: "",
        estimatedBudgetEUR: totalBudget,
      };

      // 4. Update Zustand state directly
      usePlannerStore.setState({
        tasks: defaultTasks,
        documents: formattedDocs,
        expenses: formattedExpenses,
        trip: tripDetails,
        credentials: [],
        rawCredentials: [],
        isLocked: false,
      });

      // 5. Bulk write directly to Firestore
      const batch = writeBatch(db);
      defaultTasks.forEach((t) => batch.set(doc(db, "users", userId, "tasks", t.id), t));
      formattedDocs.forEach((d) => batch.set(doc(db, "users", userId, "documents", d.id), d));
      formattedExpenses.forEach((e) => batch.set(doc(db, "users", userId, "expenses", e.id), e));
      batch.set(doc(db, "users", userId, "trip", "details"), tripDetails);

      await batch.commit();
      toast.success("Kreator wyjazdu ukończony pomyślnie!");

      // Final setUser triggers store reload and decryption config
      await usePlannerStore.getState().setUser({ uid: userId, email });
    } catch (err: any) {
      console.error(err);
      let msg = "Wystąpił błąd podczas zakładania profilu.";
      if (err.code === "auth/email-already-in-use") {
        msg = "Ten e-mail jest już zajęty!";
      } else if (err.code === "auth/weak-password") {
        msg = "Hasło jest zbyt słabe!";
      }
      toast.error(msg);
      // Rollback step to register step
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-md border border-border shadow-xl overflow-hidden">
        {/* Step Progress Header */}
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Erasmus Planner Buddy</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/45" : "w-2 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* STEP 1: WELCOME & REGISTRATION */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Witaj w Erasmus Planner Buddy! ✈️</h2>
                    <p className="text-muted-foreground text-sm">
                      Zaczynamy! Stwórz konto zabezpieczone pełnym szyfrowaniem E2EE, a następnie wspólnie zaplanujemy Twój wyjazd.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Twój adres e-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="student@uczelnia.edu.pl"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Hasło konta (Master Key)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Minimum 6 znaków"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        🔒 To hasło będzie Twoim kluczem deszyfrującym. Dane i pliki są szyfrowane po stronie przeglądarki przed wysłaniem na serwery.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: TRIP CONFIGURATION */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Dokąd i na co wyjeżdżasz?</h2>
                    <p className="text-muted-foreground text-sm">
                      Wpisz szczegóły wyjazdu, abyśmy mogli spersonalizować listę zadań i dokumentów.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Trip Type Select (Studies vs Traineeship) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => setTripType("studies")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          tripType === "studies"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <GraduationCap className="h-8 w-8" />
                        <span className="font-semibold text-sm">Studia Erasmus+</span>
                      </div>

                      <div
                        onClick={() => setTripType("traineeship")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          tripType === "traineeship"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Briefcase className="h-8 w-8" />
                        <span className="font-semibold text-sm">Praktyki Erasmus+</span>
                      </div>
                    </div>

                    {/* Country, City, Inst */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-country">Kraj docelowy</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="trip-country"
                            placeholder="np. Niemcy, Hiszpania"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-city">Miasto docelowe</Label>
                        <Input
                          id="trip-city"
                          placeholder="np. Monachium, Barcelona"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="trip-institution">Uczelnia / Instytucja przyjmująca</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="trip-institution"
                          placeholder="np. Technical University of Munich, firma XYZ"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-start">Planowany start</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="trip-start"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-end">Planowany koniec</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="trip-end"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DOCUMENTS CHECKLIST */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Potrzebne Dokumenty</h2>
                    <p className="text-muted-foreground text-sm">
                      Zaznacz dokumenty, które będą Ci potrzebne. Domyślnie zaznaczyliśmy standardowy zestaw dla wyjazdu typu: **{tripType === "studies" ? "Studia" : "Praktyki"}**.
                    </p>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto border rounded-xl divide-y bg-background/50">
                    {DOC_TEMPLATES[tripType].map((docItem) => {
                      const checked = selectedDocs.includes(docItem.name);
                      return (
                        <div
                          key={docItem.name}
                          onClick={() => toggleDoc(docItem.name)}
                          className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors hover:bg-muted ${
                            checked ? "bg-primary/5" : ""
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                              checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                            }`}
                          >
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">{docItem.name}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {docItem.category}
                              </span>
                              {docItem.required && (
                                <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                  Wymagany
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: GRANT & BUDGET SETUP */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Ustal stypendium / budżet</h2>
                    <p className="text-muted-foreground text-sm">
                      Wybierz standardową stawkę miesięczną dofinansowania Erasmus+ lub wpisz kwotę samodzielnie.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Country group rates cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        onClick={() => setGrantGroup("1")}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                          grantGroup === "1" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="block font-bold text-sm">Grupa 1</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">(Dania, Szwecja...)</span>
                        <span className="block text-xs font-semibold mt-2">
                          {tripType === "studies" ? "670" : "820"} € / m.
                        </span>
                      </div>

                      <div
                        onClick={() => setGrantGroup("2")}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                          grantGroup === "2" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="block font-bold text-sm">Grupa 2</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">(Niemcy, Hiszpania...)</span>
                        <span className="block text-xs font-semibold mt-2">
                          {tripType === "studies" ? "670" : "820"} € / m.
                        </span>
                      </div>

                      <div
                        onClick={() => setGrantGroup("3")}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                          grantGroup === "3" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="block font-bold text-sm">Grupa 3</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">(Polska, Czechy...)</span>
                        <span className="block text-xs font-semibold mt-2">
                          {tripType === "studies" ? "600" : "750"} € / m.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <hr className="flex-1" />
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">LUB</span>
                      <hr className="flex-1" />
                    </div>

                    <div
                      onClick={() => setGrantGroup("custom")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        grantGroup === "custom" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs">Wpisz kwotę ręcznie (Suma stypendium)</span>
                        <div className="h-4 w-4 rounded-full border flex items-center justify-center">
                          {grantGroup === "custom" && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                      {grantGroup === "custom" && (
                        <div className="mt-3">
                          <Label htmlFor="custom-budget-input" className="sr-only">Kwota ręczna</Label>
                          <Input
                            id="custom-budget-input"
                            type="number"
                            placeholder="Wpisz np. 3500 €"
                            value={customTotalBudget}
                            onChange={(e) => setCustomTotalBudget(e.target.value)}
                            className="bg-background text-foreground text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Calculated preview */}
                    {grantGroup !== "custom" && (
                      <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between text-xs md:text-sm">
                        <div className="space-y-1">
                          <span className="text-muted-foreground block">Wyliczone dofinansowanie:</span>
                          <span className="font-medium text-foreground">
                            {durationMonths} mies. x {monthlyRate} € / mies.
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary block">{totalCalculatedGrant} €</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: INITIAL EXPENSES CHECKLIST */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Koszty na start (Przypomnienia)</h2>
                    <p className="text-muted-foreground text-sm">
                      Zaznacz początkowe koszty, które musisz opłacić przed lub zaraz po przyjeździe. Dodamy je automatycznie do Twojego budżetu jako przypomnienia o wydatkach.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {EXPENSE_TEMPLATES.map((exp) => {
                      const checked = !!selectedExpenses.find((e) => e.title === exp.title);
                      return (
                        <div
                          key={exp.title}
                          onClick={() => toggleExpense(exp.title, exp.amount)}
                          className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                            checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                              }`}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </div>
                            <span className="text-xs md:text-sm font-medium">{exp.title}</span>
                          </div>
                          <span className="text-xs font-semibold bg-muted px-2 py-1 rounded">{exp.amount} €</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        {/* Wizard Footer Action Buttons */}
        <div className="bg-primary/5 border-t px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="text-xs"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Wstecz
          </Button>

          {step < 5 ? (
            <Button onClick={nextStep} className="text-xs">
              Dalej <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Tworzenie profilu...
                </>
              ) : (
                <>
                  Dokończ rejestrację <FileText className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
