"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "./ui/overlay";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster position="bottom-right" toastOptions={{ className: "!rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-pop !text-[13px]" }} />
    </TooltipProvider>
  );
}
