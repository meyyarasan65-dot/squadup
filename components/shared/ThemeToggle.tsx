"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const THEME_KEY = "squadup:theme";

/**
 * Dark/light switch. The icon is chosen with the `dark:` variant rather than state, so server
 * and client markup always match and there's no icon flash before hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.classList.contains("light") ? "dark" : "light";
    root.classList.toggle("light", next === "light");
    root.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the choice just won't persist.
    }
  };

  return (
    <Button variant="ghost" size="icon" className={className} onClick={toggle} aria-label="Toggle light/dark theme">
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}
