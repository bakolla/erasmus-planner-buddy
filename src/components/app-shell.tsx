import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ListChecks,
  FileText,
  Wallet,
  Plane,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Sliders,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { AuthModal } from "./auth-modal";
import { UnlockModal } from "./unlock-modal";
import { PersonalizationModal } from "./personalization-modal";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  const nav = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/tasks", label: t("nav.tasks"), icon: ListChecks },
    { to: "/documents", label: t("nav.documents"), icon: FileText },
    { to: "/budget", label: t("nav.budget"), icon: Wallet },
    { to: "/trip", label: t("nav.trip"), icon: Plane },
  ] as const;

  return (
    <nav aria-label="Główna nawigacja" className="flex flex-col gap-1 p-3">
      {nav.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

interface SidebarInnerProps {
  onOpenAuth: () => void;
  onOpenPersonalization: () => void;
}

function SidebarInner({ onOpenAuth, onOpenPersonalization }: SidebarInnerProps) {
  const { user, signOut, trip } = usePlannerStore();
  const { t } = useTranslation();

  const customLinks = trip?.customLinks || [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Plane className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-sidebar-foreground font-semibold leading-tight">Erasmus</div>
          <div className="text-xs text-sidebar-foreground/60 leading-tight">Planner</div>
        </div>
      </div>
      <NavList />

      {/* Dynamic Important Links */}
      {customLinks.length > 0 && (
        <div className="px-5 py-2 border-t border-sidebar-border/30 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-2 flex items-center gap-1.5">
            <Link2 className="h-3 w-3" />
            {t("nav.importantLinks")}
          </p>
          <ul className="space-y-1">
            {customLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-sidebar-foreground/80 hover:text-sidebar-primary transition-colors py-1 px-1 rounded hover:bg-sidebar-accent/50 truncate"
                >
                  <span className="truncate">{link.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-auto p-4 border-t border-sidebar-border/30 space-y-2">
        {/* Personalization Trigger */}
        <Button
          variant="outline"
          className="w-full text-xs h-9 justify-center gap-2 bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-sidebar-border"
          onClick={onOpenPersonalization}
        >
          <Sliders className="h-4 w-4" />
          {t("nav.personalization")}
        </Button>

        {/* User login / account info */}
        {user ? (
          <div className="flex items-center justify-between gap-2 p-1 pt-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-xs">
                {user.email ? user.email[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate" title={user.email || ""}>
                  {user.email}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50">{t("nav.synced")}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-sidebar-foreground/50 hover:bg-destructive/20 hover:text-destructive-foreground shrink-0"
              title={t("nav.logout")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full text-xs h-9 justify-center gap-2 bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-sidebar-border"
            onClick={onOpenAuth}
          >
            <LogIn className="h-4 w-4" />
            {t("nav.login")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const { authModalOpen, setAuthModalOpen } = usePlannerStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  const handleOpenAuth = () => setAuthModalOpen(true);
  const handleOpenPersonalization = () => setPersonalizationOpen(true);

  // Get active menu item title dynamically
  const activeNavItem = [
    { to: "/", label: t("nav.dashboard") },
    { to: "/tasks", label: t("nav.tasks") },
    { to: "/documents", label: t("nav.documents") },
    { to: "/budget", label: t("nav.budget") },
    { to: "/trip", label: t("nav.trip") },
  ].find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="w-full sticky top-0 h-dvh">
          <SidebarInner onOpenAuth={handleOpenAuth} onOpenPersonalization={handleOpenPersonalization} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground md:hidden"
            role="dialog"
            aria-label="Menu nawigacyjne"
          >
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Zamknij menu"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarInner 
              onOpenAuth={() => { setOpen(false); handleOpenAuth(); }} 
              onOpenPersonalization={() => { setOpen(false); handleOpenPersonalization(); }}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Otwórz menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-medium text-muted-foreground">
            {activeNavItem?.label ?? "Erasmus Planner"}
          </h1>
        </header>

        <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Auth, Unlock & Personalization Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <UnlockModal />
      <PersonalizationModal open={personalizationOpen} onOpenChange={setPersonalizationOpen} />
    </div>
  );
}
