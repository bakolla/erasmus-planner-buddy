import { useState, useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Minimize2, 
  Maximize2 
} from "lucide-react";

import { useTranslation } from "@/lib/i18n";
import { usePlannerStore } from "@/store/use-planner-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TOUR_STEPS = [
  { step: 1, path: "/", titleKey: "tour.step1Title", descKey: "tour.step1Desc" },
  { step: 2, path: "/tasks", titleKey: "tour.step2Title", descKey: "tour.step2Desc" },
  { step: 3, path: "/documents", titleKey: "tour.step3Title", descKey: "tour.step3Desc" },
  { step: 4, path: "/budget", titleKey: "tour.step4Title", descKey: "tour.step4Desc" },
  { step: 5, path: "/trip", titleKey: "tour.step5Title", descKey: "tour.step5Desc" },
  { step: 6, path: "/trip", titleKey: "tour.step6Title", descKey: "tour.step6Desc" },
  { step: 7, path: "/", titleKey: "tour.step7Title", descKey: "tour.step7Desc" },
] as const;

export function DemoTour() {
  const { user } = usePlannerStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Automatically start tour if user is "demo-user" and has not completed it yet
  useEffect(() => {
    if (user?.uid === "demo-user") {
      const isFinished = sessionStorage.getItem("demo_tour_finished");
      if (!isFinished) {
        // Wait briefly for page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [user]);

  // Sync step if user clicks on sidebar menu manually
  useEffect(() => {
    if (!isVisible || isMinimized) return;
    const currentStepObj = TOUR_STEPS[currentStep - 1];
    
    // If the path is different, update the step matching the path (first occurrences)
    if (currentStepObj && currentStepObj.path !== pathname) {
      const matchedIndex = TOUR_STEPS.findIndex((s) => s.path === pathname);
      if (matchedIndex !== -1) {
        setCurrentStep(matchedIndex + 1);
      }
    }
  }, [pathname, isVisible, isMinimized]);

  if (!isVisible) return null;

  const stepObj = TOUR_STEPS[currentStep - 1];
  if (!stepObj) return null;

  const progress = (currentStep / TOUR_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length) {
      const nextStepObj = TOUR_STEPS[currentStep];
      setCurrentStep(currentStep + 1);
      navigate({ to: nextStepObj.path });
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStepObj = TOUR_STEPS[currentStep - 2];
      setCurrentStep(currentStep - 1);
      navigate({ to: prevStepObj.path });
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("demo_tour_finished", "true");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-[45]"
      >
        <Card className="bg-card/90 backdrop-blur-lg border border-primary/20 shadow-2xl rounded-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-muted overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-indigo-500" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Compass className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {lang === "pl" ? "Przewodnik Demo" : "Demo Tour"}
                </span>
                <span className="text-[10px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded-full">
                  {currentStep} / {TOUR_STEPS.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={isMinimized ? (lang === "pl" ? "Rozwiń" : "Expand") : (lang === "pl" ? "Zminimalizuj" : "Minimize")}
                >
                  {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={lang === "pl" ? "Zamknij" : "Close"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isMinimized && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  <h3 className="text-sm font-bold text-foreground leading-snug flex items-center gap-1.5">
                    {currentStep === 1 && <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />}
                    {currentStep === TOUR_STEPS.length && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                    {t(stepObj.titleKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {t(stepObj.descKey)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-1 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                {t("tour.prev")}
              </Button>

              <div className="flex items-center gap-2">
                {currentStep === TOUR_STEPS.length ? (
                  <Button
                    size="sm"
                    onClick={handleClose}
                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-600/20 cursor-pointer"
                  >
                    {t("tour.finish")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow shadow-primary/20 cursor-pointer"
                  >
                    {t("tour.next")}
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
