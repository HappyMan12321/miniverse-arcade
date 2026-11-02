"use client";
import { ThemeProvider as Provider, useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
    </Provider>
  );
}
const subscribe = () => () => {};
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const current = mounted ? theme : "system";
  const Icon = current === "dark" ? Moon : current === "light" ? Sun : Monitor;
  return (
    <button
      className="theme-toggle"
      onClick={() =>
        setTheme(
          current === "system"
            ? "light"
            : current === "light"
              ? "dark"
              : "system",
        )
      }
      aria-label={`Theme: ${current}. Switch to ${current === "system" ? "light" : current === "light" ? "dark" : "system"} mode`}
      title={`Theme: ${current}`}
    >
      <Icon size={18} />
    </button>
  );
}
