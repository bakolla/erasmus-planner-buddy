import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/firebase";
import { usePlannerStore } from "@/store/use-planner-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const setUser = usePlannerStore((s) => s.setUser);
  const trip = usePlannerStore((s) => s.trip);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser({ uid: user.uid, email: user.email });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (!trip) return;

    // 1. Font size setting
    const fontSizeMap = {
      normal: "16px",
      large: "18px",
      xlarge: "20px",
    };
    const size = trip.fontSize || "normal";
    document.documentElement.style.fontSize = fontSizeMap[size] || "16px";

    // 2. High Contrast setting
    if (trip.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    // 3. Theme color variables mapping
    const themeColorMap = {
      indigo: {
        primary: "oklch(0.42 0.16 268)",
        ring: "oklch(0.55 0.16 268)",
      },
      emerald: {
        primary: "oklch(0.52 0.19 154)",
        ring: "oklch(0.62 0.19 154)",
      },
      amber: {
        primary: "oklch(0.64 0.18 75)",
        ring: "oklch(0.74 0.18 75)",
      },
      rose: {
        primary: "oklch(0.53 0.22 17)",
        ring: "oklch(0.63 0.22 17)",
      },
      cyan: {
        primary: "oklch(0.55 0.18 200)",
        ring: "oklch(0.65 0.18 200)",
      },
    };
    const theme = trip.themeColor || "indigo";
    const colors = themeColorMap[theme] || themeColorMap.indigo;

    document.documentElement.style.setProperty("--primary", colors.primary);
    document.documentElement.style.setProperty("--ring", colors.ring);

    // 4. Lang HTML attribute
    const lang = trip.language || "pl";
    document.documentElement.setAttribute("lang", lang);
  }, [trip]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AppShell>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
