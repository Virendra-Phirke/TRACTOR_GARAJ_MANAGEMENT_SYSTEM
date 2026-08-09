"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

/**
 * Wraps the dashboard layout. Toggles a CSS class on <html>
 * so that pure CSS handles the theme-editor offset — no React
 * inline-style race conditions, no Portal issues.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { themeEditorOpen } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (themeEditorOpen) {
      root.classList.add("theme-editor-open");
    } else {
      root.classList.remove("theme-editor-open");
    }
    return () => root.classList.remove("theme-editor-open");
  }, [themeEditorOpen]);

  return (
    <div className="dashboard-layout flex h-screen overflow-hidden">
      {children}
    </div>
  );
}
