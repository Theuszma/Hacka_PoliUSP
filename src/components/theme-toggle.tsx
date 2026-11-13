"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("elo-theme", dark ? "dark" : "light"); } catch {}
  };
  return (
    <Button variant="ghost" size="icon-sm" className={className} onClick={toggle} aria-label="Alternar tema claro e escuro">
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
