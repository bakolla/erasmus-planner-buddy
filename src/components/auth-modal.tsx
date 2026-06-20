import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";

import { usePlannerStore } from "@/store/use-planner-store";
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

const schema = z.object({
  email: z.string().email("Wprowadź poprawny adres e-mail"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
});

type FormValues = z.infer<typeof schema>;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signIn, signUp } = usePlannerStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
        toast.success("Konto zostało utworzone! Zalogowano pomyślnie.");
      } else {
        await signIn(data.email, data.password);
        toast.success("Zalogowano pomyślnie.");
      }
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error(error);
      let message = "Wystąpił błąd podczas autoryzacji.";
      if (error.code === "auth/email-already-in-use") {
        message = "Ten adres e-mail jest już przypisany do innego konta.";
      } else if (error.code === "auth/invalid-credential") {
        message = "Niepoprawny e-mail lub hasło.";
      } else if (error.code === "auth/weak-password") {
        message = "Hasło jest zbyt słabe.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "Niepoprawny e-mail lub hasło.";
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
            {isSignUp ? "Stwórz konto" : "Zaloguj się"}
          </DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Załóż konto, aby zapisywać swoje dane w chmurze i mieć do nich dostęp z każdego urządzenia."
              : "Zaloguj się na swoje konto, aby zsynchronizować dane i pliki."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adres e-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="twoj.email@przyklad.com"
                className="pl-9"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
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
            {isSignUp ? "Rejestracja" : "Zaloguj się"}
          </Button>
        </form>

        <div className="flex flex-col items-center justify-center gap-2 border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            {isSignUp ? "Masz już konto?" : "Nie masz jeszcze konta?"}
          </span>
          <Button variant="link" onClick={toggleMode} className="h-auto p-0 font-semibold">
            {isSignUp ? "Zaloguj się" : "Zarejestruj się teraz"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
