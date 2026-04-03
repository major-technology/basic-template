export function Logo({
  fallbackLabel = "",
  className,
}: {
  variant?: "full" | "icon";
  fallbackLabel?: string;
  className?: string;
}) {
  return <span className={className}>{fallbackLabel}</span>;
}
