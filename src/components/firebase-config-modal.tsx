import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Settings, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getFirebaseConfig, saveFirebaseConfigToLocalStorage, clearFirebaseConfigFromLocalStorage } from "@/lib/firebase";

interface FirebaseConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FirebaseConfigModal({ open, onOpenChange }: FirebaseConfigModalProps) {
  const [pasteValue, setPasteValue] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");

  useEffect(() => {
    if (open) {
      const current = getFirebaseConfig();
      if (current) {
        setApiKey(current.apiKey || "");
        setAuthDomain(current.authDomain || "");
        setProjectId(current.projectId || "");
        setStorageBucket(current.storageBucket || "");
        setMessagingSenderId(current.messagingSenderId || "");
        setAppId(current.appId || "");
      }
    }
  }, [open]);

  // Attempt to parse pasted JS object or JSON
  const handlePasteChange = (val: string) => {
    setPasteValue(val);
    if (!val.trim()) return;

    const extractKey = (key: string) => {
      const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`);
      const match = val.match(regex);
      return match ? match[1] : "";
    };

    const parsedApiKey = extractKey("apiKey");
    const parsedAuthDomain = extractKey("authDomain");
    const parsedProjectId = extractKey("projectId");
    const parsedStorageBucket = extractKey("storageBucket");
    const parsedMessagingSenderId = extractKey("messagingSenderId");
    const parsedAppId = extractKey("appId");

    if (parsedApiKey && parsedProjectId) {
      setApiKey(parsedApiKey);
      setAuthDomain(parsedAuthDomain);
      setProjectId(parsedProjectId);
      setStorageBucket(parsedStorageBucket);
      setMessagingSenderId(parsedMessagingSenderId);
      setAppId(parsedAppId);
      toast.success("Pomyślnie wykryto konfigurację Firebase!");
      setPasteValue("");
    }
  };

  const handleSave = () => {
    if (!apiKey || !projectId || !storageBucket) {
      toast.error("Pola API Key, Project ID oraz Storage Bucket są wymagane!");
      return;
    }

    const config = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseConfigToLocalStorage(config);
    toast.success("Zapisano konfigurację Firebase. Aplikacja zostanie przeładowana, aby połączyć się z bazą danych.");
    
    // Reload to apply configuration and re-initialize Firebase
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 1500);
  };

  const handleClear = () => {
    clearFirebaseConfigFromLocalStorage();
    toast.success("Usunięto konfigurację Firebase. Aplikacja przejdzie w tryb lokalny po przeładowaniu.");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Settings className="h-6 w-6 text-primary" />
            Konfiguracja Firebase
          </DialogTitle>
          <DialogDescription>
            Skonfiguruj połączenie z własną bazą Firebase, aby włączyć zapis w chmurze i przesyłanie plików.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600 dark:text-amber-400 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Wskazówka</p>
              Możesz wkleić cały obiekt konfiguracyjny (skopiowany z konsoli Firebase), a formularz automatycznie uzupełni pozostałe pola.
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paste-config">Szybkie wklejanie (JS/JSON)</Label>
            <Textarea
              id="paste-config"
              placeholder='const firebaseConfig = { apiKey: "...", ... };'
              value={pasteValue}
              onChange={(e) => handlePasteChange(e.target.value)}
              className="font-mono text-xs h-20"
            />
          </div>

          <hr className="my-2 border-border" />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projectId">Project ID *</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-erasmus-app"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storageBucket">Storage Bucket *</Label>
              <Input
                id="storageBucket"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="my-erasmus-app.appspot.com"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="authDomain">Auth Domain</Label>
              <Input
                id="authDomain"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="my-erasmus-app.firebaseapp.com"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef..."
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 border-t pt-4">
          <Button variant="destructive" onClick={handleClear} className="w-full sm:w-auto text-xs">
            Wyczyść i wyłącz chmurę
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-xs">
              Anuluj
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto text-xs">
              Zapisz i połącz
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
