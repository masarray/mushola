import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
  thin?: boolean;
}

export function ProgressBar({ value, color, className, thin }: ProgressBarProps) {
  const normalized = String(color || "").toLowerCase();
  const fillClass =
    normalized === "green"
      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
      : normalized === "yellow"
      ? "bg-gradient-to-r from-amber-500 to-amber-400"
      : "bg-gradient-to-r from-red-500 to-orange-400";

  return (
    <div
      className={cn(
        "w-full rounded-full bg-muted overflow-hidden",
        thin ? "h-2" : "h-3",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", fillClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
