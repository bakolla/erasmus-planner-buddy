import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";

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

export function UnlockModal() {
  const { isLocked, unlock, signOut } = usePlannerStore();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Wprowadź hasło!");
      return;
    }

    setIsLoading(true);
    try {
      const success = await unlock(password.trim());
      if (success) {
        toast.success("Baza danych została odszyfrowana!");
        setPassword("");
      } else {
        toast.error("Niepoprawne hasło deszyfrujące. Spróbuj ponownie.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Błąd podczas odszyfrowywania danych.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isLocked} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[425px] [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight text-amber-500">
            <ShieldAlert className="h-6 w-6 shrink-0 text-amber-500" />
            Baza danych zablokowana
          </DialogTitle>
          <DialogDescription className="text-xs pt-1 leading-relaxed">
            Twoje dane i pliki są zaszyfrowane metodą **End-to-End (E2EE)**. Aby uzyskać do nich dostęp, wpisz hasło, którego użyłeś do logowania na to konto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Hasło logowania (klucz master)</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="unlock-password"
                type={showPassword ? "text" : "password"}
                placeholder="Wpisz hasło konta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Odszyfruj dane
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
              disabled={isLoading}
            >
              Wyloguj się z konta
            </Button>
          </div>
        </form>

        <div className="border-t pt-3 text-[10px] text-muted-foreground text-center leading-normal">
          🔒 Szyfrowanie odbywa się w Twojej przeglądarce. Hasło nie jest wysyłane do serwerów Firebase w czystym tekście.
        </div>
      </DialogContent>
    </Dialog>
  );
}
