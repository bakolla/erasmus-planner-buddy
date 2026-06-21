import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Eye, EyeOff, Plane, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingWizard } from "./onboarding-wizard";

const getSchema = (lang: "pl" | "en") => z.object({
  email: z.string().email(lang === "pl" ? "Wprowadź poprawny adres e-mail" : "Enter a valid email address"),
  password: z.string().min(6, lang === "pl" ? "Hasło musi mieć minimum 6 znaków" : "Password must be at least 6 characters"),
});

type FormValues = z.infer<ReturnType<typeof getSchema>>;

export function AuthPage() {
  const { signIn, signInAsDemo } = usePlannerStore();
  const { t, lang } = useTranslation();
  const [view, setView] = useState<"login" | "onboarding">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signInAsDemo();
      toast.success(lang === "pl" ? "Zalogowano do konta demo." : "Logged in to demo account.");
    } catch (error) {
      console.error(error);
      toast.error(lang === "pl" ? "Wystąpił błąd podczas logowania demo." : "Error signing in to demo.");
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(getSchema(lang)),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success(t("auth.successLogin"));
      reset();
    } catch (error: any) {
      console.error(error);
      let message = t("auth.errorDefault");
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = t("auth.errorInvalidCredentials");
      } else if (error.code === "auth/invalid-email") {
        message = lang === "pl" ? "Niepoprawny adres e-mail." : "Invalid email address.";
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent p-4 overflow-y-auto">

      <AnimatePresence mode="wait">
        {view === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md z-10"
          >
            <div className="text-center mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-4">
                <Plane className="h-7 w-7" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Erasmus Planner Buddy
              </h1>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                {lang === "pl" 
                  ? "Twój inteligentny asystent w planowaniu wyjazdu" 
                  : "Your smart trip planning assistant"}
              </p>
            </div>

            <Card className="bg-card/70 border border-border/50 shadow-2xl backdrop-blur-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">{t("auth.titleLogin")}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === "pl" 
                      ? "Zaloguj się, aby zsynchronizować zadania i wydatki." 
                      : "Log in to synchronize tasks and expenses."}
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={lang === "pl" ? "twoj.email@przyklad.com" : "your.email@example.com"}
                        className="pl-9 bg-background/50 border-border/40 focus:border-primary focus-visible:ring-primary/25"
                        {...register("email")}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        className="pl-9 pr-9 bg-background/50 border-border/40 focus:border-primary focus-visible:ring-primary/25"
                        {...register("password")}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-6 h-10 shadow-lg shadow-primary/10" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("auth.buttonLogin")}
                  </Button>
                </form>

                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/30" /></div>
                  <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">lub</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:text-primary transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  <Sparkles className="h-4 w-4" />
                  {t("auth.buttonDemo")}
                </Button>

                <div className="flex flex-col items-center justify-center gap-2 border-t border-border/30 mt-6 pt-5 text-xs">
                  <span className="text-muted-foreground">
                    {lang === "pl" ? "Pierwszy raz tutaj?" : "First time here?"}
                  </span>
                  <button
                    onClick={() => { reset(); setView("onboarding"); }}
                    className="text-primary font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    {lang === "pl" ? "Rozpocznij konfigurację wyjazdu" : "Start trip configuration (Register)"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl z-10"
          >
            <OnboardingWizard onBackToLogin={() => setView("login")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
