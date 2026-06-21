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
  Check,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/store/use-planner-store";
import { useTranslation } from "@/lib/i18n";
import { AuthModal } from "./auth-modal";
import { UnlockModal } from "./unlock-modal";
import { AccessibilityWidget } from "./accessibility-widget";
import { AuthPage } from "./auth-page";
import { DemoTour } from "./demo-tour";
import { AmbientBackground } from "./ambient-background";

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
}

function SidebarInner({ onOpenAuth }: SidebarInnerProps) {
  const { user, signOut, trip, updateTrip } = usePlannerStore();
  const { t, lang } = useTranslation();

  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const customLinks = trip?.customLinks || [];

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink = {
      id: Math.random().toString(36).slice(2, 9),
      title: linkTitle.trim(),
      url: formattedUrl,
    };

    const updatedLinks = [...customLinks, newLink];
    await updateTrip({ customLinks: updatedLinks });
    setLinkTitle("");
    setLinkUrl("");
    setShowAddLink(false);
    toast.success(lang === "pl" ? "Dodano ważny link!" : "Link added successfully!");
  };

  const handleDeleteLink = async (linkId: string) => {
    const updatedLinks = customLinks.filter((l) => l.id !== linkId);
    await updateTrip({ customLinks: updatedLinks });
    toast.success(lang === "pl" ? "Usunięto link" : "Link removed");
  };

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

      {/* Dynamic Important Links Section */}
      <div className="px-5 py-2 border-t border-sidebar-border/30 mt-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/45 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            {t("nav.importantLinks")}
          </span>
          <button
            type="button"
            onClick={() => setShowAddLink(!showAddLink)}
            className="text-[10px] text-sidebar-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring p-0.5 rounded font-medium"
            title={t("nav.addLink")}
          >
            {showAddLink ? (lang === "pl" ? "Anuluj" : "Cancel") : `+ ${t("nav.addLink")}`}
          </button>
        </p>

        {/* Custom Links List with Hover Trash Icon */}
        {customLinks.length > 0 ? (
          <ul className="space-y-1 mb-2">
            {customLinks.map((link) => (
              <li key={link.id} className="group flex items-center justify-between gap-1 rounded hover:bg-sidebar-accent/50 transition-colors px-1.5 py-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-sidebar-foreground/80 hover:text-sidebar-primary transition-colors truncate flex-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring rounded"
                >
                  <span className="truncate font-medium">{link.title}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteLink(link.id)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 text-sidebar-foreground/40 hover:text-destructive transition-all cursor-pointer rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                  title={lang === "pl" ? "Usuń link" : "Delete link"}
                  aria-label={lang === "pl" ? `Usuń link ${link.title}` : `Delete link ${link.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !showAddLink && (
            <p className="text-[10px] text-sidebar-foreground/40 italic py-1 px-1.5">
              {lang === "pl" ? "Brak ważnych linków." : "No links added."}
            </p>
          )
        )}

        {/* Inline Add Link Form */}
        {showAddLink && (
          <form onSubmit={handleAddLink} className="space-y-2 p-2 rounded bg-sidebar-accent/30 border border-sidebar-border/30 mt-1">
            <div className="space-y-1">
              <label htmlFor="sidebar-link-title" className="sr-only">{t("settings.linkTitle")}</label>
              <input
                id="sidebar-link-title"
                type="text"
                placeholder={t("settings.linkTitle")}
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full text-[11px] bg-sidebar border border-sidebar-border/50 rounded px-2 py-1.5 text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                required
              />
            </div>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <label htmlFor="sidebar-link-url" className="sr-only">{t("settings.linkUrl")}</label>
                <input
                  id="sidebar-link-url"
                  type="text"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full text-[11px] bg-sidebar border border-sidebar-border/50 rounded px-2 py-1.5 text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground rounded text-[11px] font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
                title={lang === "pl" ? "Zapisz link" : "Save link"}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="mt-auto p-4 border-t border-sidebar-border/30 space-y-2">
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
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
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
  const { authModalOpen, setAuthModalOpen, user, isAuthLoading } = usePlannerStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  const handleOpenAuth = () => setAuthModalOpen(true);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AmbientBackground />
        <AuthPage />
        <AccessibilityWidget />
      </>
    );
  }

  // Get active menu item title dynamically
  const activeNavItem = [
    { to: "/", label: t("nav.dashboard") },
    { to: "/tasks", label: t("nav.tasks") },
    { to: "/documents", label: t("nav.documents") },
    { to: "/budget", label: t("nav.budget") },
    { to: "/trip", label: t("nav.trip") },
  ].find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <div className="min-h-dvh flex bg-transparent">
      <AmbientBackground />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="w-full sticky top-0 h-dvh">
          <SidebarInner onOpenAuth={handleOpenAuth} />
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

      {/* Auth, Unlock & Accessibility Widget */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <UnlockModal />
      <AccessibilityWidget />
      <DemoTour />
    </div>
  );
}
