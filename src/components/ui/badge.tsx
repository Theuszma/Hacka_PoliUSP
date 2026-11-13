import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "./cn";

const badge = cva("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-medium [&_svg]:size-3", {
  variants: {
    tone: {
      neutral: "border-border bg-muted/60 text-muted-foreground",
      brand: "border-transparent bg-brand-soft text-brand",
      success: "border-transparent bg-success-soft text-success",
      warning: "border-transparent bg-warning-soft text-warning",
      danger: "border-transparent bg-danger-soft text-danger",
      info: "border-transparent bg-info-soft text-info",
      outline: "bg-background text-foreground",
    },
    dot: { true: "before:size-1.5 before:rounded-full before:bg-current before:content-['']", false: "" },
  },
  defaultVariants: { tone: "neutral", dot: false },
});

export function Badge({ className, tone, dot, ...p }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone, dot }), className)} {...p} />;
}
