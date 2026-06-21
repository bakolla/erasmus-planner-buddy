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
import { useTranslation } from "@/lib/i18n";

const uid = () => Math.random().toString(36).slice(2, 10);

const DOC_TEMPLATES = {
  studies: [
    { id: "docStudies1", nameKey: "onboarding.docStudies1", categoryKey: "onboarding.catHomeUniversity", required: true },
    { id: "docStudies2", nameKey: "onboarding.docStudies2", categoryKey: "onboarding.catGrant", required: true },
    { id: "docStudies3", nameKey: "onboarding.docStudies3", categoryKey: "onboarding.catHealth", required: true },
    { id: "docStudies4", nameKey: "onboarding.docStudies4", categoryKey: "onboarding.catHomeUniversity", required: false },
    { id: "docStudies5", nameKey: "onboarding.docStudies5", categoryKey: "onboarding.catHostUniversity", required: true },
    { id: "docStudies6", nameKey: "onboarding.docStudies6", categoryKey: "onboarding.catHostUniversity", required: false },
    { id: "docStudies7", nameKey: "onboarding.docStudies7", categoryKey: "onboarding.catHostUniversity", required: true },
  ],
  traineeship: [
    { id: "docTrainee1", nameKey: "onboarding.docTrainee1", categoryKey: "onboarding.catHomeUniversity", required: true },
    { id: "docTrainee2", nameKey: "onboarding.docTrainee2", categoryKey: "onboarding.catEmployer", required: true },
    { id: "docTrainee3", nameKey: "onboarding.docTrainee3", categoryKey: "onboarding.catInsurance", required: true },
    { id: "docTrainee4", nameKey: "onboarding.docTrainee4", categoryKey: "onboarding.catHealth", required: true },
    { id: "docTrainee5", nameKey: "onboarding.docTrainee5", categoryKey: "onboarding.catEmployer", required: false },
    { id: "docTrainee6", nameKey: "onboarding.docTrainee6", categoryKey: "onboarding.catEmployer", required: true },
  ],
};

const EXPENSE_TEMPLATES = [
  { id: "deposit", titleKey: "onboarding.expDeposit", amount: 450, selected: true },
  { id: "flights", titleKey: "onboarding.expFlights", amount: 150, selected: true },
  { id: "insurance", titleKey: "onboarding.expInsurance", amount: 40, selected: false },
  { id: "pass", titleKey: "onboarding.expPass", amount: 35, selected: true },
  { id: "shopping", titleKey: "onboarding.expShopping", amount: 100, selected: true },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

interface OnboardingWizardProps {
  onBackToLogin?: () => void;
}

export function OnboardingWizard({ onBackToLogin }: OnboardingWizardProps) {
  const { signUp } = usePlannerStore();
  const { t, lang } = useTranslation();
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
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  // Set default documents when tripType changes
  useEffect(() => {
    const templates = DOC_TEMPLATES[tripType];
    setSelectedDocs(templates.map((d) => d.id));
  }, [tripType]);

  // Set default expenses on mount
  useEffect(() => {
    setSelectedExpenses(EXPENSE_TEMPLATES.filter(e => e.selected).map(e => e.id));
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
        toast.error(t("onboarding.validationEmailPass"));
        return;
      }
      if (password.length < 6) {
        toast.error(t("onboarding.validationWeakPass"));
        return;
      }
    }
    if (step === 2) {
      if (!country.trim() || !city.trim() || !institution.trim() || !startDate || !endDate) {
        toast.error(t("onboarding.validationFields"));
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        toast.error(t("onboarding.validationDates"));
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const toggleDoc = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const toggleExpense = (id: string) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Sign up the user
      await signUp(email.trim(), password);

      // 2. Fetch UID from store
      const userId = usePlannerStore.getState().user?.uid;

      if (!userId || !db) {
        throw new Error(
          lang === "pl"
            ? "Błąd autoryzacji Firebase. Spróbuj zalogować się ponownie."
            : "Firebase authentication error. Please try logging in again."
        );
      }

      // 3. Format documents, expenses, and default tasks
      const formattedDocs: DocumentItem[] = selectedDocs.map((docId) => {
        const template = DOC_TEMPLATES[tripType].find((t) => t.id === docId);
        return {
          id: uid(),
          name: t(template?.nameKey || ""),
          category: t(template?.categoryKey || "Formalności"),
          status: "todo",
          deadline: startDate,
        };
      });

      const formattedExpenses: Expense[] = selectedExpenses.map((expId) => {
        const template = EXPENSE_TEMPLATES.find((e) => e.id === expId);
        return {
          id: uid(),
          title: t(template?.titleKey || ""),
          category: lang === "pl" ? "Na start" : "Initial",
          amount: template?.amount || 0,
          currency: "EUR",
        };
      });

      const defaultTasks: Task[] = [
        {
          id: uid(),
          title: t("onboarding.taskSignLA"),
          deadline: startDate,
          priority: "high",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: t("onboarding.taskHealthInsurance"),
          deadline: startDate,
          priority: "high",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: t("onboarding.taskAccommodation"),
          deadline: startDate,
          priority: "high",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: t("onboarding.taskTickets"),
          deadline: startDate,
          priority: "medium",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
        {
          id: uid(),
          title: t("onboarding.taskContactCoordinator"),
          deadline: startDate,
          priority: "low",
          status: "todo",
          createdAt: new Date().toISOString(),
        },
      ];

      const currentTrip = usePlannerStore.getState().trip;
      const tripDetails = {
        country: country.trim(),
        city: city.trim(),
        institution: institution.trim(),
        type: tripType === "studies" ? "studies" : "traineeship",
        startDate,
        endDate,
        emergencyContact: "",
        accommodationAddress: "",
        estimatedBudgetEUR: totalBudget,
        themeColor: currentTrip?.themeColor || "indigo",
        fontSize: currentTrip?.fontSize || "normal",
        highContrast: !!currentTrip?.highContrast,
        darkMode: !!currentTrip?.darkMode,
        language: currentTrip?.language || lang,
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
      toast.success(t("onboarding.successFinish"));

      // Final setUser triggers store reload
      await usePlannerStore.getState().setUser({ uid: userId, email });
    } catch (err: any) {
      console.error(err);
      let msg = lang === "pl" ? "Wystąpił błąd podczas zakładania profilu." : "An error occurred while creating the profile.";
      if (err.code === "auth/email-already-in-use") {
        msg = t("auth.errorEmailInUse");
      } else if (err.code === "auth/weak-password") {
        msg = t("auth.errorWeakPassword");
      }
      toast.error(msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const displayWizardTripType = tripType === "studies" ? (lang === "pl" ? "Studia" : "Studies") : (lang === "pl" ? "Praktyki" : "Traineeship");

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-md border border-border shadow-xl overflow-hidden">
        {/* Step Progress Header */}
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Erasmus Planner Buddy</span>
          </div>
          <div className="flex items-center gap-1.5" role="img" aria-label={`Krok ${step} z 5`}>
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="space-y-6"
            >
              {/* STEP 1: WELCOME & REGISTRATION */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">{t("onboarding.welcomeTitle")}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t("onboarding.welcomeDesc")}
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">{t("onboarding.emailLabel")}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder={lang === "pl" ? "student@uczelnia.edu.pl" : "student@university.edu"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password">{t("onboarding.passwordLabel")}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder={lang === "pl" ? "Minimum 6 znaków" : "Minimum 6 characters"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 focus-visible:ring-primary"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        {t("onboarding.passwordHint")}
                      </p>
                    </div>
                    {onBackToLogin && (
                      <div className="pt-2 text-center text-xs text-muted-foreground">
                        {t("auth.footerSignUpText")}{" "}
                        <button
                          type="button"
                          onClick={onBackToLogin}
                          className="text-primary font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                          {t("auth.footerSignUpLink")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: TRIP CONFIGURATION */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">{t("onboarding.tripTitle")}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t("onboarding.tripDesc")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Trip Type Select Buttons (studies vs traineeship) */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setTripType("studies")}
                        className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          tripType === "studies"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <GraduationCap className="h-9 w-9" />
                        <span className="font-semibold text-sm">{t("onboarding.studiesType")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTripType("traineeship")}
                        className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          tripType === "traineeship"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Briefcase className="h-9 w-9" />
                        <span className="font-semibold text-sm">{t("onboarding.traineeshipType")}</span>
                      </button>
                    </div>

                    {/* Country, City, Inst */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-country">{t("onboarding.countryLabel")}</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="trip-country"
                            placeholder={t("onboarding.countryPlaceholder")}
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="pl-9 focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-city">{t("onboarding.cityLabel")}</Label>
                        <Input
                          id="trip-city"
                          placeholder={t("onboarding.cityPlaceholder")}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="trip-institution">{t("onboarding.institutionLabel")}</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="trip-institution"
                          placeholder={t("onboarding.institutionPlaceholder")}
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="pl-9 focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-start">{t("onboarding.startLabel")}</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="trip-start"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-9 focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="trip-end">{t("onboarding.endLabel")}</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="trip-end"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-9 focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DOCUMENTS CHECKLIST WITH STAGGER ANIMATIONS */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">{t("onboarding.docsTitle")}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t("onboarding.docsDesc", { type: displayWizardTripType })}
                    </p>
                  </div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="max-h-[300px] overflow-y-auto border rounded-xl divide-y bg-background/50"
                  >
                    {DOC_TEMPLATES[tripType].map((docItem) => {
                      const checked = selectedDocs.includes(docItem.id);
                      return (
                        <motion.button
                          type="button"
                          variants={itemVariants}
                          key={docItem.id}
                          onClick={() => toggleDoc(docItem.id)}
                          className={`w-full text-left flex items-start gap-3 p-3.5 cursor-pointer transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
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
                            <p className="text-sm font-medium leading-snug">{t(docItem.nameKey)}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {t(docItem.categoryKey)}
                              </span>
                              {docItem.required && (
                                <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                  {t("onboarding.requiredBadge")}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {/* STEP 4: GRANT & BUDGET SETUP WITH FOCUS STYLING */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">{t("onboarding.budgetTitle")}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t("onboarding.budgetDesc")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Country group rates cards as accessible buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setGrantGroup("1")}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          grantGroup === "1" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="block font-bold text-sm">{lang === "pl" ? "Grupa 1" : "Group 1"}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{lang === "pl" ? "(Dania, Szwecja...)" : "(Denmark, Sweden...)"}</span>
                        <span className="block text-xs font-semibold mt-2">
                          {tripType === "studies" ? "670" : "820"} € / m.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGrantGroup("2")}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          grantGroup === "2" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="block font-bold text-sm">{lang === "pl" ? "Grupa 2" : "Group 2"}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{lang === "pl" ? "(Niemcy, Hiszpania...)" : "(Germany, Spain...)"}</span>
                        <span className="block text-xs font-semibold mt-2">
                          {tripType === "studies" ? "670" : "820"} € / m.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGrantGroup("3")}
                        className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          grantGroup === "3" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="block font-bold text-sm">{lang === "pl" ? "Grupa 3" : "Group 3"}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{lang === "pl" ? "(Polska, Czechy...)" : "(Poland, Czech Rep...)"}</span>
                        <span className="block text-xs font-semibold mt-2">
                          {tripType === "studies" ? "600" : "750"} € / m.
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <hr className="flex-1" />
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">{lang === "pl" ? "LUB" : "OR"}</span>
                      <hr className="flex-1" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setGrantGroup("custom")}
                      className={`w-full text-left p-4 rounded-xl border-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        grantGroup === "custom" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs">{t("onboarding.manualRate")}</span>
                        <div className="h-4 w-4 rounded-full border flex items-center justify-center border-current">
                          {grantGroup === "custom" && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                      {grantGroup === "custom" && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <Label htmlFor="custom-budget-input" className="sr-only">Kwota ręczna</Label>
                          <Input
                            id="custom-budget-input"
                            type="number"
                            placeholder={t("onboarding.manualPlaceholder")}
                            value={customTotalBudget}
                            onChange={(e) => setCustomTotalBudget(e.target.value)}
                            className="bg-background text-foreground text-sm focus-visible:ring-primary"
                          />
                        </div>
                      )}
                    </button>

                    {/* Calculated preview */}
                    {grantGroup !== "custom" && (
                      <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between text-xs md:text-sm">
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-left">{t("onboarding.calcGrant")}</span>
                          <span className="font-medium text-foreground text-left block">
                            {t("onboarding.calcRateHint", { months: durationMonths, rate: monthlyRate })}
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

              {/* STEP 5: INITIAL EXPENSES WITH STAGGER ANIMATIONS */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">{t("onboarding.expensesTitle")}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t("onboarding.expensesDesc")}
                    </p>
                  </div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-3"
                  >
                    {EXPENSE_TEMPLATES.map((exp) => {
                      const checked = selectedExpenses.includes(exp.id);
                      return (
                        <motion.button
                          type="button"
                          variants={itemVariants}
                          key={exp.id}
                          onClick={() => toggleExpense(exp.id)}
                          className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                            checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
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
                            <span className="text-xs md:text-sm font-medium">{t(exp.titleKey)}</span>
                          </div>
                          <span className="text-xs font-semibold bg-muted px-2 py-1 rounded text-foreground">{exp.amount} €</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
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
            <ChevronLeft className="mr-1 h-4 w-4" /> {t("onboarding.backBtn")}
          </Button>

          {step < 5 ? (
            <Button onClick={nextStep} className="text-xs">
              {t("onboarding.nextBtn")} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("onboarding.creatingProfile")}
                </>
              ) : (
                <>
                  {t("onboarding.finishBtn")} <FileText className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
