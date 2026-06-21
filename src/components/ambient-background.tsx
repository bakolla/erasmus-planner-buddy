import { usePlannerStore } from "@/store/use-planner-store";

const THEME_BLOBS = {
  indigo: {
    light: [
      "bg-indigo-300/30",
      "bg-violet-300/25",
      "bg-purple-200/20",
    ],
    dark: [
      "bg-indigo-900/20",
      "bg-violet-950/25",
      "bg-purple-900/15",
    ],
  },
  emerald: {
    light: [
      "bg-emerald-300/30",
      "bg-teal-300/25",
      "bg-green-200/20",
    ],
    dark: [
      "bg-emerald-950/25",
      "bg-teal-950/25",
      "bg-green-950/15",
    ],
  },
  amber: {
    light: [
      "bg-amber-300/30",
      "bg-orange-300/25",
      "bg-yellow-200/20",
    ],
    dark: [
      "bg-amber-950/25",
      "bg-orange-950/25",
      "bg-yellow-950/15",
    ],
  },
  rose: {
    light: [
      "bg-rose-300/30",
      "bg-pink-300/25",
      "bg-red-200/20",
    ],
    dark: [
      "bg-rose-950/25",
      "bg-pink-950/25",
      "bg-red-950/15",
    ],
  },
  cyan: {
    light: [
      "bg-cyan-300/30",
      "bg-sky-300/25",
      "bg-blue-200/20",
    ],
    dark: [
      "bg-cyan-950/25",
      "bg-sky-950/25",
      "bg-blue-950/15",
    ],
  },
} as const;

export function AmbientBackground() {
  const trip = usePlannerStore((s) => s.trip);

  const disableAmbient = !!trip?.disableAmbient;
  const highContrast = !!trip?.highContrast;
  const reducedMotion = !!trip?.reducedMotion;
  const theme = trip?.themeColor || "indigo";
  const isDark = !!trip?.darkMode;

  // Don't show in high contrast mode or if disabled by user
  if (disableAmbient || highContrast) {
    return null;
  }

  const blobs = THEME_BLOBS[theme] || THEME_BLOBS.indigo;
  const activeBlobs = isDark ? blobs.dark : blobs.light;

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden -z-50 select-none bg-background/50"
      aria-hidden="true"
    >
      {/* Blob 1 */}
      <div
        className={`absolute -top-20 -left-20 w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full blur-[100px] md:blur-[150px] ${activeBlobs[0]} transition-colors duration-700 ${reducedMotion ? "" : "animate-blob-1"}`}
      />

      {/* Blob 2 */}
      <div
        className={`absolute -bottom-25 -right-25 w-[380px] h-[380px] md:w-[550px] md:h-[550px] rounded-full blur-[100px] md:blur-[150px] ${activeBlobs[1]} transition-colors duration-700 ${reducedMotion ? "" : "animate-blob-2"}`}
      />

      {/* Blob 3 */}
      <div
        className={`absolute top-[40%] left-[30%] w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full blur-[110px] md:blur-[160px] ${activeBlobs[2]} transition-colors duration-700 ${reducedMotion ? "" : "animate-blob-3"}`}
      />
    </div>
  );
}
