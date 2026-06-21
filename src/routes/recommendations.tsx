import { createFileRoute } from "@tanstack/react-router";
import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Compass,
  Home,
  Plus,
  Search,
  User,
  Heart,
  Link2,
  MapPin,
  Loader2,
  Camera,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Rekomendacje — Erasmus Planner" },
      { name: "description", content: "Atrakcje i mieszkania polecane przez studentów programu Erasmus." },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { recommendations, toggleLikeRecommendation, addRecommendation, trip, user, isAuthLoading } = usePlannerStore();
  const { t, lang } = useTranslation();

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [hasInitializedSearch, setHasInitializedSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "attractions" | "housing">("all");

  // New recommendation wizard form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [newTitle, setNewTitle] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCategory, setNewCategory] = useState<"attractions" | "housing">("attractions");
  const [newDescription, setNewDescription] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newRecommendedBy, setNewRecommendedBy] = useState("");
  const [newPhotoPreview, setNewPhotoPreview] = useState("");

  // Initialize search query with user's trip city or country
  useEffect(() => {
    if ((trip.city || trip.country) && !hasInitializedSearch) {
      setSearchQuery(trip.city || trip.country);
      setHasInitializedSearch(true);
    }
  }, [trip.city, trip.country, hasInitializedSearch]);

  // Set default values when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      if (!newCountry) {
        setNewCountry(trip.country || "");
      }
      if (!newCity) {
        setNewCity(trip.city || "");
      }
      if (!newRecommendedBy) {
        setNewRecommendedBy(user?.email?.split("@")[0] || "");
      }
    }
  }, [isAddDialogOpen, trip, user]);

  if (isAuthLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filtering recommendations logic
  const filteredRecommendations = (recommendations || []).filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory =
      activeCategory === "all" || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLikeToggle = async (recId: string) => {
    try {
      await toggleLikeRecommendation(recId);
      const rec = (recommendations || []).find((r) => r.id === recId);
      const currentlyLiked = rec?.likes?.includes(user.uid);
      toast.success(currentlyLiked ? t("recommendations.toastUnliked") : t("recommendations.toastLiked"));
    } catch (err) {
      toast.error(t("recommendations.toastLikeError"));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(lang === "pl" ? "Wybierz plik graficzny." : "Please choose an image file.");
      return;
    }

    // Limit to 600 KB (614400 bytes)
    if (file.size > 600 * 1024) {
      toast.error(t("recommendations.validationPhotoSize"));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setNewPhotoPreview("");
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newCountry.trim() || !newCity.trim() || !newDescription.trim() || !newRecommendedBy.trim()) {
      toast.error(lang === "pl" ? "Wypelnij wszystkie pola!" : "Fill in all fields!");
      return;
    }

    try {
      let formattedLink = newLink.trim();
      if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
        formattedLink = `https://${formattedLink}`;
      }

      await addRecommendation({
        title: newTitle.trim(),
        location: `${newCity.trim()}, ${newCountry.trim()}`,
        category: newCategory,
        description: newDescription.trim(),
        recommendedBy: newRecommendedBy.trim(),
        link: formattedLink || undefined,
        photoDataB64: newPhotoPreview || undefined,
        likes: [],
      });

      toast.success(t("recommendations.toastAdded"));
      setIsAddDialogOpen(false);
      
      // Reset wizard
      setFormStep(1);
      setNewTitle("");
      setNewDescription("");
      setNewLink("");
      setNewPhotoPreview("");
    } catch (err) {
      toast.error(lang === "pl" ? "Nie udalo sie zapisac polecenia" : "Failed to save recommendation");
    }
  };

  const nextStep = () => {
    if (formStep === 1) {
      if (!newTitle.trim() || !newCountry.trim() || !newCity.trim()) {
        toast.error(lang === "pl" ? "Wypelnij nazwe, kraj oraz miasto!" : "Fill in the name, country and city!");
        return;
      }
    } else if (formStep === 2) {
      if (!newDescription.trim()) {
        toast.error(lang === "pl" ? "Wypelnij opis!" : "Fill in the description!");
        return;
      }
    }
    setFormStep((prev) => (prev + 1) as 1 | 2 | 3);
  };

  const prevStep = () => {
    setFormStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{t("recommendations.pageTitle")}</h2>
          <p className="mt-1 text-muted-foreground">{t("recommendations.pageSubtitle")}</p>
        </div>
        <Button
          onClick={() => {
            setFormStep(1);
            setIsAddDialogOpen(true);
          }}
          className="w-full sm:w-auto gap-1.5 focus-visible:ring-primary shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t("recommendations.addNewBtn")}
        </Button>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("recommendations.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 focus-visible:ring-primary"
          />
        </div>
        
        <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/30 self-start md:self-auto">
          <Button
            variant={activeCategory === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            className="text-xs rounded-md h-8 py-0"
          >
            {t("recommendations.all")}
          </Button>
          <Button
            variant={activeCategory === "attractions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory("attractions")}
            className="text-xs rounded-md h-8 py-0 gap-1"
          >
            <Compass className="h-3.5 w-3.5" />
            {t("recommendations.attractions")}
          </Button>
          <Button
            variant={activeCategory === "housing" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory("housing")}
            className="text-xs rounded-md h-8 py-0 gap-1"
          >
            <Home className="h-3.5 w-3.5" />
            {t("recommendations.housing")}
          </Button>
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card/45 backdrop-blur-sm border border-border/40 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Compass className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed text-center">
            {t("recommendations.noResults")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecommendations.map((rec) => {
            const hasLiked = rec.likes?.includes(user.uid) || false;
            const likeCount = rec.likes?.length || 0;

            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex"
              >
                <Card className="w-full flex flex-col overflow-hidden bg-card/75 backdrop-blur-sm hover:shadow-md transition-shadow border border-border/40">
                  {/* Photo Preview Top Banner */}
                  {rec.photoDataB64 && (
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={rec.photoDataB64}
                        alt={rec.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105 duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <CardContent className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wider">
                          {rec.category === "attractions" ? t("recommendations.attractions") : t("recommendations.housing")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-primary/75" />
                          {rec.location}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-base text-foreground leading-snug">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">
                          {rec.description}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border/30 mt-5 pt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" />
                        <span>{t("recommendations.recommendedBy")}: <strong>{rec.recommendedBy}</strong></span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* External Link button */}
                        {rec.link && (
                          <a
                            href={rec.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-bold"
                            title={rec.link}
                          >
                            <Link2 className="h-3 w-3" />
                            {lang === "pl" ? "Link" : "Link"}
                          </a>
                        )}

                        {/* Likes counter button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeToggle(rec.id)}
                          className={cn(
                            "h-7 px-2 text-[10px] gap-1 rounded-md transition-all cursor-pointer",
                            hasLiked 
                              ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <Heart className={cn("h-3.5 w-3.5 transition-transform active:scale-125 duration-100", hasLiked ? "fill-rose-500 text-rose-500" : "")} />
                          <span className="tabular-nums font-bold">{likeCount}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 3-Step Wizard Modal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>{t("recommendations.dialogTitle")}</span>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Krok {formStep} z 3
              </span>
            </DialogTitle>
            
            {/* Wizard step bullets progress bar */}
            <div className="w-full flex gap-1 pt-3">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 flex-1",
                    formStep === stepNum 
                      ? "bg-primary" 
                      : stepNum < formStep 
                        ? "bg-primary/55" 
                        : "bg-muted"
                  )}
                />
              ))}
            </div>
          </DialogHeader>

          <form onSubmit={handleWizardSubmit} className="space-y-4 pt-2">
            <AnimatePresence mode="wait">
              {/* STEP 1: Basic Info */}
              {formStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-primary/80">
                    {t("recommendations.dialogStepBasic")}
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="rec-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("recommendations.dialogName")}
                    </Label>
                    <Input
                      id="rec-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={lang === "pl" ? "np. Park Guell, Pokój studencki" : "e.g. Park Guell, Student Room"}
                      className="bg-background/50 focus-visible:ring-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="rec-country" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("recommendations.dialogCountry")}
                      </Label>
                      <Input
                        id="rec-country"
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                        placeholder={lang === "pl" ? "np. Hiszpania" : "e.g. Spain"}
                        className="bg-background/50 focus-visible:ring-primary"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="rec-city" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("recommendations.dialogCity")}
                      </Label>
                      <Input
                        id="rec-city"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder={lang === "pl" ? "np. Barcelona" : "e.g. Barcelona"}
                        className="bg-background/50 focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rec-category" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("recommendations.dialogCategory")}
                    </Label>
                    <select
                      id="rec-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as "attractions" | "housing")}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="attractions">{t("recommendations.attractions")}</option>
                      <option value="housing">{t("recommendations.housing")}</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Description and Links */}
              {formStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-primary/80">
                    {t("recommendations.dialogStepDetails")}
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="rec-desc" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("recommendations.dialogDescription")}
                    </Label>
                    <Textarea
                      id="rec-desc"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder={lang === "pl" ? "Opisz dlaczego warto, podaj wskazówki..." : "Describe why it's worth it, add tips..."}
                      className="min-h-[100px] resize-none bg-background/50 focus-visible:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rec-link" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("recommendations.labelLink")}
                    </Label>
                    <Input
                      id="rec-link"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="https://..."
                      className="bg-background/50 focus-visible:ring-primary"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Media Upload & Nickname Sign-off */}
              {formStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-primary/80">
                    {t("recommendations.dialogStepMedia")}
                  </p>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("recommendations.labelPhoto")}
                    </Label>
                    
                    {newPhotoPreview ? (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                        <img src={newPhotoPreview} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-black text-white hover:text-rose-500 rounded-full transition-colors cursor-pointer"
                          title={lang === "pl" ? "Usuń zdjęcie" : "Remove photo"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg aspect-video cursor-pointer hover:bg-muted/40 hover:border-primary/50 transition-all p-4">
                        <Camera className="h-8 w-8 text-muted-foreground/80 mb-2" />
                        <span className="text-xs font-semibold text-muted-foreground text-center">
                          {t("recommendations.photoHint")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rec-user" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("recommendations.dialogUser")}
                    </Label>
                    <Input
                      id="rec-user"
                      value={newRecommendedBy}
                      onChange={(e) => setNewRecommendedBy(e.target.value)}
                      placeholder={lang === "pl" ? "Twoje imię / nick" : "Your name / nickname"}
                      className="bg-background/50 focus-visible:ring-primary"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/30 flex items-center justify-between">
              <div>
                {formStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="text-xs font-medium gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("recommendations.backBtn")}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-xs font-medium"
                >
                  {t("recommendations.cancelBtn")}
                </Button>

                {formStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="text-xs font-semibold gap-1"
                  >
                    {t("recommendations.nextBtn")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button type="submit" className="text-xs font-semibold shadow-md gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                    <Check className="h-3.5 w-3.5" />
                    {t("recommendations.saveBtn")}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
