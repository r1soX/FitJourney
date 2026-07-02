import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "border-white/10 bg-white/5 text-white/70",
  accent: "border-accent/30 bg-accent/15 text-accent-soft",
  green: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  yellow: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  red: "border-red-500/30 bg-red-500/15 text-red-300",
  purple: "border-violet-500/30 bg-violet-500/15 text-violet-300",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
