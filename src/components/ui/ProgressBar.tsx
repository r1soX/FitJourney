import { cn } from "@/lib/utils";

export function ProgressBar({
  progress,
  className,
  barClassName,
  height = 8,
}: {
  progress: number;
  className?: string;
  barClassName?: string;
  height?: number;
}) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      style={{ height }}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-accent-soft to-accent-deep transition-all duration-700",
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
