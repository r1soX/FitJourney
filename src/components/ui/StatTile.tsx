import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  sub,
  icon,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("glass p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="label-muted">{label}</span>
        {icon && (
          <span className={cn("text-white/40", accent && "text-accent-soft")}>{icon}</span>
        )}
      </div>
      <div
        className={cn(
          "mt-2 text-2xl font-bold tabular tracking-tight",
          accent ? "text-accent-soft" : "text-white",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-white/50">{sub}</div>}
    </div>
  );
}
