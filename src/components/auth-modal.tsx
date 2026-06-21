import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Eye, EyeOff, Sparkles } from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getSchema = (lang: "pl" | "en") => z.object({
  email: z.string().email(lang === "pl" ? "Wprowadź poprawny adres e-mail" : "Enter a valid email address"),
  password: z.string().min(6, lang === "pl" ? "Hasło musi mieć minimum 6 znaków" : "Password must be at least 6 characters"),
});

type FormValues = z.infer<ReturnType<typeof getSchema>>;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signIn, signUp, signInAsDemo } = usePlannerStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await signInAsDemo();
      toast.success(lang === "pl" ? "Zalogowano do konta demo." : "Logged in to demo account.");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(lang === "pl" ? "Wystąpił błąd podczas logowania demo." : "Error signing in to demo.");
    } finally {
      setIsLoading(false);
    }
  };
  const { t, lang } = useTranslation();

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
      if (isSignUp) {
        await signUp(data.email, data.password);
        toast.success(t("auth.successSignUp"));
      } else {
        await signIn(data.email, data.password);
        toast.success(t("auth.successLogin"));
      }
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error(error);
      let message = t("auth.errorDefault");
      if (error.code === "auth/email-already-in-use") {
        message = t("auth.errorEmailInUse");
      } else if (error.code === "auth/invalid-credential") {
        message = t("auth.errorInvalidCredentials");
      } else if (error.code === "auth/weak-password") {
        message = t("auth.errorWeakPassword");
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = t("auth.errorInvalidCredentials");
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? t("auth.titleSignUp") : t("auth.titleLogin")}
          </DialogTitle>
          <DialogDescription>
            {isSignUp ? t("auth.descSignUp") : t("auth.descLogin")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={lang === "pl" ? "twoj.email@przyklad.com" : "your.email@example.com"}
                className="pl-9"
                {...register("email")}
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
                className="pl-9 pr-9"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? t("auth.buttonSignUp") : t("auth.buttonLogin")}
          </Button>
        </form>

        {!isSignUp && (
          <>
            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/30" /></div>
              <span className="relative bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">lub</span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:text-primary transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4" />
              {t("auth.buttonDemo")}
            </Button>
          </>
        )}

        <div className="flex flex-col items-center justify-center gap-2 border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            {isSignUp ? t("auth.footerSignUpText") : t("auth.footerLoginText")}
          </span>
          <Button variant="link" onClick={toggleMode} className="h-auto p-0 font-semibold">
            {isSignUp ? t("auth.footerSignUpLink") : t("auth.footerLoginLink")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
