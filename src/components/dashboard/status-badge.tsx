type StatusBadgeProps = {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
};

const toneClasses: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "border-border bg-surface text-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/15 text-foreground",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-sm border px-sm text-xs font-semibold",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
