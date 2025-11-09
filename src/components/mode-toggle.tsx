"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    
    // Determine the new theme - default to "light" if theme is undefined, "system", or not "dark"
    const currentTheme = theme || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    // Check if startViewTransition is available (for smooth transitions)
    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      try {
        (document as any).startViewTransition(() => {
          setTheme(newTheme);
        });
      } catch (error) {
        // Fallback if startViewTransition fails
        setTheme(newTheme);
      }
    } else {
      setTheme(newTheme);
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="px-2"
        disabled
      >
        <SunIcon className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  // Default to dark theme (matches defaultTheme in layout)
  const isDark = theme !== "light";

  return (
    <Button
      variant="ghost"
      type="button"
      size="icon"
      className="px-2"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <MoonIcon className="h-[1.2rem] w-[1.2rem] text-neutral-200" />
      ) : (
        <SunIcon className="h-[1.2rem] w-[1.2rem] text-neutral-800" />
      )}
    </Button>
  );
}
