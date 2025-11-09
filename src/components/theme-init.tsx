"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    // Ensure dark mode is set on initial load
    try {
      const theme = localStorage.getItem("theme");
      if (!theme) {
        localStorage.setItem("theme", "dark");
        document.documentElement.classList.add("dark");
      } else if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      // Fallback to dark mode
      document.documentElement.classList.add("dark");
    }
  }, []);

  return null;
}

