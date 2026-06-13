interface BadgeProps {
  variant: "open" | "planned" | "shipped" | "popular";
  children: React.ReactNode;
}

const variantStyles: Record<BadgeProps["variant"], string> = {
  open: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  planned: "bg-accent-light text-accent dark:bg-accent-dark/20 dark:text-accent",
  shipped: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  popular: "bg-accent text-white",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
