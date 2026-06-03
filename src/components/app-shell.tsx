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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Zadania", icon: ListChecks },
  { to: "/documents", label: "Dokumenty", icon: FileText },
  { to: "/budget", label: "Budżet", icon: Wallet },
  { to: "/trip", label: "Wyjazd", icon: Plane },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

function SidebarInner() {
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
      <div className="mt-auto p-4 text-xs text-sidebar-foreground/60">
        <p>Powodzenia na wyjeździe! ✈️</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="w-full sticky top-0 h-dvh">
          <SidebarInner />
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
            <SidebarInner />
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
            {nav.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)))?.label ?? "Erasmus Planner"}
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
    </div>
  );
}
