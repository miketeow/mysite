import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "decoration-border/75 font-mono text-3xl font-bold tracking-tight underline decoration-2 underline-offset-8",
        className
      )}
    >
      {children}
    </Tag>
  );
}
