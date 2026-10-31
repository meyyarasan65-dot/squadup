"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getTheme = () => (document.documentElement.classList.contains("light") ? "light" : "dark");

/** Sonner toaster that follows the <html> theme class and clears the mobile bottom tab bar. */
export function ThemedToaster() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      mobileOffset={{ bottom: 84, left: 16, right: 16 }}
      toastOptions={{
        classNames: {
          toast: "!bg-zinc-900 !border-zinc-800 !text-zinc-100",
          description: "!text-zinc-400",
          success: "!border-emerald-500/40 [&_[data-icon]]:!text-emerald-400",
          error: "!border-red-500/40 [&_[data-icon]]:!text-red-400",
          warning: "!border-amber-500/40 [&_[data-icon]]:!text-amber-400",
          info: "!border-indigo-500/40 [&_[data-icon]]:!text-indigo-400",
        },
      }}
    />
  );
}
