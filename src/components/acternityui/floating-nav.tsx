"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Separator } from "../ui/separator";
import LogOutBtn from "../logout.btn";
import { useAuth } from "@/context/auth.context";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
    external?: boolean;
  }[];
  className?: string;
}) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme !== "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    
    const newTheme = theme === "dark" ? "light" : "dark";
    
    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      try {
        (document as any).startViewTransition(() => {
          setTheme(newTheme);
        });
      } catch (error) {
        setTheme(newTheme);
      }
    } else {
      setTheme(newTheme);
    }
  };

  // Create theme item with dynamic icon
  const themeItem = {
    name: "theme",
    link: "#",
    icon: mounted ? (
      isDark ? (
        <MoonIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ) : (
        <SunIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      )
    ) : (
      <SunIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
    ),
    external: false,
    isTheme: true,
  };

  // Split nav items into groups: pages (first 3), social (next 4), then theme
  const pageItems = navItems.slice(0, 3); // home, blogs, guestbook
  const socialItems = navItems.slice(3); // github, linkedin, x, email

  const renderNavItem = (navItem: any, idx: number) => {
    if (navItem.isTheme) {
      return (
        <button
          key={`link=${idx}`}
          onClick={toggleTheme}
          className={cn(
            "group relative flex flex-col items-center justify-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-300 cursor-pointer py-2",
          )}
          aria-label="Toggle theme"
        >
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap capitalize pointer-events-none bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 px-2 py-1 rounded">
            {navItem.name}
          </span>
          <div className="transform transition-transform duration-300 group-hover:scale-125">
            {navItem.icon}
          </div>
        </button>
      );
    }

    const linkProps = navItem.external
      ? {
          href: navItem.link,
          target: "_blank",
          rel: "noopener noreferrer",
        }
      : {
          href: navItem.link,
        };

    return (
      <Link
        key={`link=${idx}`}
        {...linkProps}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-300 py-2",
        )}
      >
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap capitalize pointer-events-none bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 px-2 py-1 rounded">
          {navItem.name}
        </span>
        <div className="transform transition-transform duration-300 group-hover:scale-125">
          {navItem.icon}
        </div>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex max-w-fit fixed bottom-10 inset-x-0 mx-auto border border-transparent dark:border-white/[0.2] rounded-full dark:bg-transparent bg-white backdrop-blur-lg shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] px-6 py-4 items-center justify-center gap-4",
        className,
      )}
    >
      {/* Page links: home, blogs, guestbook */}
      {pageItems.map((navItem, idx) => renderNavItem(navItem, idx))}
      
      {/* Separator after pages */}
      <Separator orientation="vertical" className="h-8 w-px bg-neutral-300 dark:bg-neutral-700" />
      
      {/* Social links: github, linkedin, x, email */}
      {socialItems.map((navItem, idx) => renderNavItem(navItem, idx + pageItems.length))}
      
      {/* Separator before theme */}
      <Separator orientation="vertical" className="h-8 w-px bg-neutral-300 dark:bg-neutral-700" />
      
      {/* Theme toggle */}
      {renderNavItem(themeItem, navItems.length)}
      
      {user && (
        <>
          <Separator orientation="vertical" className="h-8 w-px bg-neutral-300 dark:bg-neutral-700" />
          <LogOutBtn isLarge={true} />
        </>
      )}
    </div>
  );
};
